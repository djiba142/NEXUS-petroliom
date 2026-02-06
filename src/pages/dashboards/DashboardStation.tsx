import { useEffect, useState } from 'react';
import { 
  Fuel, 
  Package, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  History,
  Droplets,
  Thermometer
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { StockIndicator } from '@/components/dashboard/StockIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Station {
  id: string;
  nom: string;
  code: string;
  ville: string;
  region: string;
  type: string;
  capacite_essence: number;
  capacite_gasoil: number;
  capacite_gpl: number;
  capacite_lubrifiants: number;
  stock_essence: number;
  stock_gasoil: number;
  stock_gpl: number;
  stock_lubrifiants: number;
  nombre_pompes: number;
  statut: string;
  entreprise_id: string;
}

interface Livraison {
  id: string;
  carburant: string;
  quantite: number;
  date_livraison: string;
  statut: string;
  bon_livraison: string | null;
  chauffeur_nom: string | null;
}

export default function DashboardStation() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [station, setStation] = useState<Station | null>(null);
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for new delivery
  const [newLivraison, setNewLivraison] = useState({
    carburant: '',
    quantite: '',
    bon_livraison: '',
    chauffeur_nom: '',
    camion_immatriculation: ''
  });

  useEffect(() => {
    if (profile?.station_id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile?.station_id]);

  const fetchData = async () => {
    try {
      // Fetch station
      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .select('*')
        .eq('id', profile?.station_id)
        .maybeSingle();

      if (stationError) throw stationError;
      setStation(stationData);

      // Fetch recent livraisons
      const { data: livraisonsData, error: livraisonsError } = await supabase
        .from('livraisons')
        .select('*')
        .eq('station_id', profile?.station_id)
        .order('date_livraison', { ascending: false })
        .limit(10);

      if (livraisonsError) throw livraisonsError;
      setLivraisons(livraisonsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLivraison = async () => {
    if (!station || !newLivraison.carburant || !newLivraison.quantite) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert livraison
      const { error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          station_id: station.id,
          carburant: newLivraison.carburant,
          quantite: parseInt(newLivraison.quantite),
          bon_livraison: newLivraison.bon_livraison || null,
          chauffeur_nom: newLivraison.chauffeur_nom || null,
          camion_immatriculation: newLivraison.camion_immatriculation || null,
          created_by: user?.id,
          statut: 'confirme'
        });

      if (livraisonError) throw livraisonError;

      // Update station stock
      const stockField = `stock_${newLivraison.carburant}`;
      const currentStock = station[stockField as keyof Station] as number;
      const newStock = currentStock + parseInt(newLivraison.quantite);

      const { error: updateError } = await supabase
        .from('stations')
        .update({ [stockField]: newStock })
        .eq('id', station.id);

      if (updateError) throw updateError;

      toast({
        title: "Livraison enregistrée",
        description: `${parseInt(newLivraison.quantite).toLocaleString()} L de ${newLivraison.carburant} ajoutés au stock`,
      });

      // Reset form and refresh data
      setNewLivraison({
        carburant: '',
        quantite: '',
        bon_livraison: '',
        chauffeur_nom: '',
        camion_immatriculation: ''
      });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting livraison:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la livraison",
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

  if (loading) {
    return (
      <DashboardLayout title="Ma Station" subtitle="Chargement...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!station) {
    return (
      <DashboardLayout title="Ma Station" subtitle="Aucune station assignée">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fuel className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune station assignée</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Votre compte n'est pas encore lié à une station-service. 
              Veuillez contacter votre responsable d'entreprise pour être assigné.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const essencePercent = getStockPercentage(station.stock_essence, station.capacite_essence);
  const gasoilPercent = getStockPercentage(station.stock_gasoil, station.capacite_gasoil);
  const gplPercent = getStockPercentage(station.stock_gpl, station.capacite_gpl);

  return (
    <DashboardLayout 
      title={station.nom}
      subtitle={`${station.code} • ${station.ville}, ${station.region}`}
    >
      {/* Station Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Fuel className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">{station.nom}</h2>
              <p className="text-primary-foreground/80">
                {station.type === 'depot' ? 'Dépôt' : station.type === 'routiere' ? 'Station Routière' : 'Station Urbaine'} • {station.nombre_pompes} pompes
              </p>
            </div>
          </div>
          <Badge variant={station.statut === 'ouverte' ? 'default' : 'secondary'} className="bg-white/20 text-white border-0">
            {station.statut === 'ouverte' ? 'Ouverte' : station.statut === 'fermee' ? 'Fermée' : 'En travaux'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Stock Essence"
          value={`${essencePercent}%`}
          subtitle={`${station.stock_essence.toLocaleString()} / ${station.capacite_essence.toLocaleString()} L`}
          icon={Droplets}
          variant={essencePercent < 10 ? 'critical' : essencePercent < 25 ? 'warning' : 'success'}
        />
        <StatCard
          title="Stock Gasoil"
          value={`${gasoilPercent}%`}
          subtitle={`${station.stock_gasoil.toLocaleString()} / ${station.capacite_gasoil.toLocaleString()} L`}
          icon={Droplets}
          variant={gasoilPercent < 10 ? 'critical' : gasoilPercent < 25 ? 'warning' : 'success'}
        />
        <StatCard
          title="Stock GPL"
          value={`${gplPercent}%`}
          subtitle={`${station.stock_gpl.toLocaleString()} / ${station.capacite_gpl.toLocaleString()} L`}
          icon={Thermometer}
          variant={gplPercent < 25 ? 'warning' : 'default'}
        />
        <StatCard
          title="Livraisons (mois)"
          value={livraisons.length}
          subtitle="réceptions enregistrées"
          icon={Package}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-primary" />
                  Niveaux de Stock
                </CardTitle>
                <CardDescription>
                  État actuel des cuves
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Enregistrer Livraison
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enregistrer une Livraison</DialogTitle>
                    <DialogDescription>
                      Saisir les informations de la livraison reçue
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="carburant">Type de carburant *</Label>
                      <Select 
                        value={newLivraison.carburant}
                        onValueChange={(value) => setNewLivraison({...newLivraison, carburant: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le carburant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="essence">Essence</SelectItem>
                          <SelectItem value="gasoil">Gasoil</SelectItem>
                          <SelectItem value="gpl">GPL</SelectItem>
                          <SelectItem value="lubrifiants">Lubrifiants</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantite">Quantité (litres) *</Label>
                      <Input
                        id="quantite"
                        type="number"
                        placeholder="Ex: 15000"
                        value={newLivraison.quantite}
                        onChange={(e) => setNewLivraison({...newLivraison, quantite: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bon_livraison">N° Bon de livraison</Label>
                      <Input
                        id="bon_livraison"
                        placeholder="Ex: BL-2026-001"
                        value={newLivraison.bon_livraison}
                        onChange={(e) => setNewLivraison({...newLivraison, bon_livraison: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chauffeur">Nom du chauffeur</Label>
                        <Input
                          id="chauffeur"
                          placeholder="Ex: Mamadou Diallo"
                          value={newLivraison.chauffeur_nom}
                          onChange={(e) => setNewLivraison({...newLivraison, chauffeur_nom: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="immatriculation">Immatriculation camion</Label>
                        <Input
                          id="immatriculation"
                          placeholder="Ex: RC 1234 GN"
                          value={newLivraison.camion_immatriculation}
                          onChange={(e) => setNewLivraison({...newLivraison, camion_immatriculation: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSubmitLivraison} 
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? 'Enregistrement...' : 'Enregistrer la livraison'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Essence</span>
                  <span className="text-xs text-muted-foreground">{station.stock_essence.toLocaleString()} / {station.capacite_essence.toLocaleString()} L</span>
                </div>
                <StockIndicator percentage={essencePercent} size="lg" showPercentage={true} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Gasoil</span>
                  <span className="text-xs text-muted-foreground">{station.stock_gasoil.toLocaleString()} / {station.capacite_gasoil.toLocaleString()} L</span>
                </div>
                <StockIndicator percentage={gasoilPercent} size="lg" showPercentage={true} />
              </div>
              {station.capacite_gpl > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">GPL</span>
                    <span className="text-xs text-muted-foreground">{station.stock_gpl.toLocaleString()} / {station.capacite_gpl.toLocaleString()} L</span>
                  </div>
                  <StockIndicator percentage={gplPercent} size="lg" showPercentage={true} />
                </div>
              )}
              {station.capacite_lubrifiants > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Lubrifiants</span>
                    <span className="text-xs text-muted-foreground">{station.stock_lubrifiants.toLocaleString()} / {station.capacite_lubrifiants.toLocaleString()} L</span>
                  </div>
                  <StockIndicator percentage={getStockPercentage(station.stock_lubrifiants, station.capacite_lubrifiants)} size="lg" showPercentage={true} />
                </div>
              )}
            </div>
            
            {/* Alerts */}
            {(essencePercent < 25 || gasoilPercent < 25) && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Attention - Stock bas</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {essencePercent < 25 && `Essence à ${essencePercent}%. `}
                  {gasoilPercent < 25 && `Gasoil à ${gasoilPercent}%.`}
                  {' '}Pensez à commander un réapprovisionnement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Dernières Livraisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {livraisons.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Aucune livraison enregistrée
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {livraisons.slice(0, 5).map((livraison) => (
                  <div 
                    key={livraison.id}
                    className="p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize text-sm">
                        {livraison.carburant}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {livraison.statut === 'confirme' ? 'Confirmé' : livraison.statut}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      +{livraison.quantite.toLocaleString()} L
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(livraison.date_livraison).toLocaleDateString('fr-FR')}
                    </p>
                    {livraison.bon_livraison && (
                      <p className="text-xs text-muted-foreground">
                        BL: {livraison.bon_livraison}
                      </p>
                    )}
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
