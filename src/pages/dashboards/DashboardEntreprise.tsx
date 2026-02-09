import { useEffect, useState } from 'react';
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  BarChart3,
  MapPin,
  Building2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { GuineaMap } from '@/components/map/GuineaMap';
import { StationCard } from '@/components/stations/StationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { mockStations } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, History } from 'lucide-react';

interface Station {
  id: string;
  nom: string;
  code: string;
  ville: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
  capacite_essence: number;
  capacite_gasoil: number;
  stock_essence: number;
  stock_gasoil: number;
  nombre_pompes: number;
  statut: string;
}

interface Entreprise {
  id: string;
  nom: string;
  sigle: string;
  type: string;
  region: string;
  logo_url: string | null;
}

export default function DashboardEntreprise() {
  const { profile, user } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [newLivraison, setNewLivraison] = useState({
    station_id: '',
    carburant: '',
    quantite: '',
    bon_livraison: '',
  });

  useEffect(() => {
    if (profile?.entreprise_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile?.entreprise_id]);

  const fetchData = async () => {
    try {
      // Fetch entreprise
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', profile?.entreprise_id)
        .maybeSingle();

      if (entrepriseError) throw entrepriseError;
      setEntreprise(entrepriseData);

      // Fetch stations
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('*')
        .eq('entreprise_id', profile?.entreprise_id)
        .order('nom');

      if (stationsError) throw stationsError;
      setStations(stationsData || []);

      // Fetch recent livraisons for company stations
      if (stationsData && stationsData.length > 0) {
        const stationIds = stationsData.map(s => s.id);
        const { data: livraisonsData } = await supabase
          .from('livraisons')
          .select('*, station:stations(nom)')
          .in('station_id', stationIds)
          .order('date_livraison', { ascending: false })
          .limit(10);

        setLivraisons(livraisonsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLivraison = async () => {
    if (!newLivraison.station_id || !newLivraison.carburant || !newLivraison.quantite) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const selectedStation = stations.find(s => s.id === newLivraison.station_id);
      if (!selectedStation) throw new Error("Station non trouvée");

      // 1. Record delivery
      const { error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          station_id: newLivraison.station_id,
          carburant: newLivraison.carburant,
          quantite: parseInt(newLivraison.quantite),
          bon_livraison: newLivraison.bon_livraison || null,
          created_by: user?.id,
          statut: 'confirme'
        });

      if (livraisonError) throw livraisonError;

      // 2. Update stock
      const stockField = `stock_${newLivraison.carburant}`;
      const currentStock = (selectedStation as any)[stockField] || 0;
      const { error: updateError } = await supabase
        .from('stations')
        .update({ [stockField]: currentStock + parseInt(newLivraison.quantite) })
        .eq('id', newLivraison.station_id);

      if (updateError) throw updateError;

      toast({
        title: "Livraison enregistrée",
        description: "Le stock a été mis à jour avec succès.",
      });

      setIsDialogOpen(false);
      setNewLivraison({ station_id: '', carburant: '', quantite: '', bon_livraison: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la livraison",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStockPercentage = (stock: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((stock / capacity) * 100);
  };

  const totalCapaciteEssence = stations.reduce((acc, s) => acc + (s.capacite_essence || 0), 0);
  const totalCapaciteGasoil = stations.reduce((acc, s) => acc + (s.capacite_gasoil || 0), 0);
  const totalStockEssence = stations.reduce((acc, s) => acc + (s.stock_essence || 0), 0);
  const totalStockGasoil = stations.reduce((acc, s) => acc + (s.stock_gasoil || 0), 0);

  const stationsAlerte = stations.filter(s => {
    const essencePercent = getStockPercentage(s.stock_essence, s.capacite_essence);
    const gasoilPercent = getStockPercentage(s.stock_gasoil, s.capacite_gasoil);
    return essencePercent < 25 || gasoilPercent < 25;
  });

  // Convert stations to mock format for the map
  const mapStations = stations.map(s => ({
    id: s.id,
    nom: s.nom,
    code: s.code,
    adresse: '',
    ville: s.ville,
    region: s.region,
    coordonnees: s.latitude && s.longitude ? { lat: s.latitude, lng: s.longitude } : undefined,
    type: s.type as 'urbaine' | 'routiere' | 'depot',
    entrepriseId: profile?.entreprise_id || '',
    entrepriseNom: entreprise?.nom || '',
    capacite: {
      essence: s.capacite_essence,
      gasoil: s.capacite_gasoil,
      gpl: 0,
      lubrifiants: 0,
    },
    stockActuel: {
      essence: s.stock_essence,
      gasoil: s.stock_gasoil,
      gpl: 0,
      lubrifiants: 0,
    },
    nombrePompes: s.nombre_pompes,
    gestionnaire: { nom: '', telephone: '', email: '' },
    statut: s.statut as 'ouverte' | 'fermee' | 'en_travaux' | 'attente_validation',
  }));

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Entreprise" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!entreprise) {
    return (
      <DashboardLayout
        title="Dashboard Entreprise"
        subtitle="Aucune entreprise assignée"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune entreprise assignée</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Votre compte n'est pas encore lié à une entreprise.
              Veuillez contacter un administrateur pour être assigné à votre entreprise.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Dashboard ${entreprise.sigle}`}
      subtitle={`Gestion des stations ${entreprise.nom}`}
    >
      {/* Entreprise Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {entreprise.logo_url ? (
              <img
                src={entreprise.logo_url}
                alt={entreprise.sigle}
                className="h-16 w-16 rounded-xl bg-white p-2 object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold font-display">{entreprise.nom}</h2>
              <p className="text-primary-foreground/80">
                {entreprise.type === 'compagnie' ? 'Compagnie Importatrice' : 'Distributeur'} • {entreprise.region}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-right">
            <div>
              <p className="text-3xl font-bold">{stations.length}</p>
              <p className="text-sm text-primary-foreground/80">stations actives</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Ravitaillement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enregistrer une Livraison</DialogTitle>
                  <DialogDescription>
                    Mise à jour directe du stock pour une de vos stations.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="station">Station *</Label>
                    <Select
                      value={newLivraison.station_id}
                      onValueChange={(v) => setNewLivraison({ ...newLivraison, station_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir la station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="carburant">Carburant *</Label>
                      <Select
                        value={newLivraison.carburant}
                        onValueChange={(v) => setNewLivraison({ ...newLivraison, carburant: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essence">Essence</SelectItem>
                          <SelectItem value="gasoil">Gasoil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantite">Quantité (L) *</Label>
                      <Input
                        id="quantite"
                        type="number"
                        placeholder="Ex: 10000"
                        value={newLivraison.quantite}
                        onChange={(e) => setNewLivraison({ ...newLivraison, quantite: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bon">Bon de Livraison</Label>
                    <Input
                      id="bon"
                      placeholder="N° BL"
                      value={newLivraison.bon_livraison}
                      onChange={(e) => setNewLivraison({ ...newLivraison, bon_livraison: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleSubmitLivraison} disabled={submitting}>
                    {submitting ? "Enregistrement..." : "Confirmer la réception"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Stock Essence"
          value={`${getStockPercentage(totalStockEssence, totalCapaciteEssence)}%`}
          subtitle={`${(totalStockEssence / 1000).toFixed(0)}k / ${(totalCapaciteEssence / 1000).toFixed(0)}k L`}
          icon={Fuel}
          variant={getStockPercentage(totalStockEssence, totalCapaciteEssence) < 25 ? 'warning' : 'success'}
        />
        <StatCard
          title="Stock Gasoil"
          value={`${getStockPercentage(totalStockGasoil, totalCapaciteGasoil)}%`}
          subtitle={`${(totalStockGasoil / 1000).toFixed(0)}k / ${(totalCapaciteGasoil / 1000).toFixed(0)}k L`}
          icon={Fuel}
          variant={getStockPercentage(totalStockGasoil, totalCapaciteGasoil) < 25 ? 'warning' : 'success'}
        />
        <StatCard
          title="Stations actives"
          value={stations.filter(s => s.statut === 'ouverte').length}
          subtitle={`sur ${stations.length} total`}
          icon={MapPin}
        />
        <StatCard
          title="En alerte"
          value={stationsAlerte.length}
          subtitle="besoin ravitaillement"
          icon={AlertTriangle}
          variant={stationsAlerte.length > 0 ? 'critical' : 'default'}
        />
      </div>

      {/* Map & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Mes Stations
              </CardTitle>
              <CardDescription>
                Localisation et niveau de stock
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <GuineaMap
                stations={mapStations.length > 0 ? mapStations : mockStations.slice(0, 3)}
                height="350px"
                showControls={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stock by Station */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Stocks par Station
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune station enregistrée
              </p>
            ) : (
              stations.slice(0, 5).map((station) => {
                const essencePercent = getStockPercentage(station.stock_essence, station.capacite_essence);
                const gasoilPercent = getStockPercentage(station.stock_gasoil, station.capacite_gasoil);

                return (
                  <div key={station.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{station.nom}</span>
                      <span className="text-xs text-muted-foreground">{station.ville}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-amber-600">Essence</span>
                          <span>{essencePercent}%</span>
                        </div>
                        <Progress
                          value={essencePercent}
                          className={`h-1.5 ${essencePercent < 25 ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-emerald-600">Gasoil</span>
                          <span>{gasoilPercent}%</span>
                        </div>
                        <Progress
                          value={gasoilPercent}
                          className={`h-1.5 ${gasoilPercent < 25 ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {stations.length > 5 && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/stations">Voir toutes les stations</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StockEvolutionChart title="Évolution des Stocks" />

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Stations en Alerte
                </CardTitle>
                <CardDescription>
                  Besoin de ravitaillement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stationsAlerte.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Aucune station en alerte
                </p>
                <p className="text-sm text-muted-foreground">
                  Tous les stocks sont suffisants
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stationsAlerte.map((station) => {
                  const essencePercent = getStockPercentage(station.stock_essence, station.capacite_essence);
                  const gasoilPercent = getStockPercentage(station.stock_gasoil, station.capacite_gasoil);

                  return (
                    <div
                      key={station.id}
                      className="p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{station.nom}</span>
                        <Badge variant="destructive">
                          {Math.min(essencePercent, gasoilPercent)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {station.ville}, {station.region}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        {essencePercent < 25 && (
                          <span className="text-red-600">
                            Essence: {essencePercent}%
                          </span>
                        )}
                        {gasoilPercent < 25 && (
                          <span className="text-red-600">
                            Gasoil: {gasoilPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deliveries log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Ravitaillements Récents
                </CardTitle>
                <CardDescription>
                  Dernières réceptions de stock
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {livraisons.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">Aucun ravitaillement récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {livraisons.map((liv) => (
                  <div key={liv.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{(liv as any).station?.nom || 'Station'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(liv.date_livraison).toLocaleDateString()} • {liv.carburant}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary">+{liv.quantite.toLocaleString()} L</span>
                      {liv.bon_livraison && <p className="text-[10px] text-muted-foreground">BL: {liv.bon_livraison}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
