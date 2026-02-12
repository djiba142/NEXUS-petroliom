import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StationCard } from '@/components/stations/StationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { regions } from '@/data/mockData';
import { Station } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import logos for mapping
import logoTotal from '@/assets/logos/total-energies.png';
import logoShell from '@/assets/logos/shell.jpg';
import logoTMI from '@/assets/logos/tmi.jpg';
import logoKP from '@/assets/logos/kamsar-petroleum.png';

const localLogoMapping: Record<string, string> = {
  'TOTAL': logoTotal,
  'TotalEnergies': logoTotal,
  'TO': logoTotal,
  'SHELL': logoShell,
  'VIVO': logoShell,
  'SH': logoShell,
  'TMI': logoTMI,
  'TM': logoTMI,
  'KP': logoKP,
};

export default function StationsPage() {
  const { role: currentUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [entreprises, setEntreprises] = useState<{ id: string, nom: string, sigle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [isStationDialogOpen, setIsStationDialogOpen] = useState(false);
  const [savingStation, setSavingStation] = useState(false);
  const [stationForm, setStationForm] = useState({
    nom: '',
    code: '',
    adresse: '',
    ville: '',
    region: '',
    type: 'urbaine' as 'urbaine' | 'routiere' | 'depot',
    entreprise_id: '',
    capacite_essence: 50000,
    capacite_gasoil: 50000,
    capacite_gpl: 0,
    capacite_lubrifiants: 0,
    gestionnaire_nom: '',
    gestionnaire_telephone: '',
    gestionnaire_email: '',
  });

  useEffect(() => {
    fetchData();
  }, [currentUserRole, currentUserProfile?.entreprise_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch entreprises for filters
      const { data: entData } = await supabase.from('entreprises').select('id, nom, sigle');
      setEntreprises(entData || []);

      // 2. Fetch stations with RBAC filtering
      let query = supabase.from('stations').select(`
        *,
        entreprises:entreprise_id(nom, sigle, logo_url)
      `);

      if (currentUserRole === 'responsable_entreprise' && currentUserProfile?.entreprise_id) {
        query = query.eq('entreprise_id', currentUserProfile.entreprise_id);
      }

      const { data: stData, error: stError } = await query;
      if (stError) throw stError;

      // 3. Map to Station type
      const mappedStations: Station[] = (stData || []).map(s => ({
        id: s.id,
        nom: s.nom,
        code: s.code,
        adresse: s.adresse,
        ville: s.ville,
        region: s.region,
        type: s.type as any,
        entrepriseId: s.entreprise_id,
        entrepriseNom: s.entreprises?.nom || 'Inconnu',
        entrepriseSigle: s.entreprises?.sigle || '',
        entrepriseLogo: s.entreprises?.logo_url || localLogoMapping[s.entreprises?.sigle || ''] || undefined,
        capacite: {
          essence: s.capacite_essence,
          gasoil: s.capacite_gasoil,
          gpl: s.capacite_gpl,
          lubrifiants: s.capacite_lubrifiants,
        },
        stockActuel: {
          essence: s.stock_essence,
          gasoil: s.stock_gasoil,
          gpl: s.stock_gpl,
          lubrifiants: s.stock_lubrifiants,
        },
        nombrePompes: s.nombre_pompes,
        gestionnaire: {
          nom: s.gestionnaire_nom || 'Non assigné',
          telephone: s.gestionnaire_telephone || '',
          email: s.gestionnaire_email || '',
        },
        statut: s.statut as any,
      }));

      setStations(mappedStations);

      // Extract unique regions
      const uniqueRegions = Array.from(new Set(mappedStations.map(s => s.region)));
      setRegionsList(uniqueRegions);

    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || s.region === selectedRegion;
    const matchesEntreprise = selectedEntreprise === 'all' || s.entrepriseId === selectedEntreprise;

    if (activeTab === 'critical') {
      const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
      const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
      return matchesSearch && matchesRegion && matchesEntreprise && (essencePercent < 10 || gasoilPercent < 10);
    }
    if (activeTab === 'warning') {
      const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
      const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
      return matchesSearch && matchesRegion && matchesEntreprise &&
        ((essencePercent >= 10 && essencePercent < 25) || (gasoilPercent >= 10 && gasoilPercent < 25));
    }

    return matchesSearch && matchesRegion && matchesEntreprise;
  });

  const criticalCount = stations.filter(s => {
    const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
    const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
    return essencePercent < 10 || gasoilPercent < 10;
  }).length;

  const warningCount = stations.filter(s => {
    const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
    const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
    return (essencePercent >= 10 && essencePercent < 25) || (gasoilPercent >= 10 && gasoilPercent < 25);
  }).length;

  const canCreateStation = currentUserRole === 'super_admin' ||
    (currentUserRole === 'responsable_entreprise' && !!currentUserProfile?.entreprise_id);

  const handleSaveStation = async () => {
    const entrepriseId = currentUserRole === 'responsable_entreprise'
      ? currentUserProfile?.entreprise_id
      : stationForm.entreprise_id;

    if (!stationForm.nom?.trim() || !stationForm.code?.trim() || !stationForm.adresse?.trim() ||
      !stationForm.ville?.trim() || !stationForm.region || !entrepriseId) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: 'Veuillez remplir le nom, le code, l\'adresse, la ville et la région.',
      });
      return;
    }

    setSavingStation(true);
    try {
      const { error } = await supabase.from('stations').insert({
        nom: stationForm.nom.trim(),
        code: stationForm.code.trim().toUpperCase(),
        adresse: stationForm.adresse.trim(),
        ville: stationForm.ville.trim(),
        region: stationForm.region,
        type: stationForm.type,
        entreprise_id: entrepriseId,
        capacite_essence: stationForm.capacite_essence || 0,
        capacite_gasoil: stationForm.capacite_gasoil || 0,
        capacite_gpl: (stationForm as any).capacite_gpl || 0,
        capacite_lubrifiants: (stationForm as any).capacite_lubrifiants || 0,
        statut: 'ouverte',
        gestionnaire_nom: stationForm.gestionnaire_nom.trim() || null,
        gestionnaire_telephone: stationForm.gestionnaire_telephone.trim() || null,
        gestionnaire_email: stationForm.gestionnaire_email.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Station enregistrée',
        description: `${stationForm.nom} a été créée avec succès.`,
      });
      setIsStationDialogOpen(false);
      setStationForm({
        nom: '',
        code: '',
        adresse: '',
        ville: '',
        region: '',
        type: 'urbaine',
        entreprise_id: '',
        capacite_essence: 50000,
        capacite_gasoil: 50000,
        capacite_gpl: 0,
        capacite_lubrifiants: 0,
        gestionnaire_nom: '',
        gestionnaire_telephone: '',
        gestionnaire_email: '',
      });
      fetchData();
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur lors de l\'enregistrement',
        description: err instanceof Error ? err.message : 'Impossible d\'enregistrer la station.',
      });
    } finally {
      setSavingStation(false);
    }
  };

  const openStationDialog = () => {
    setStationForm(prev => ({
      ...prev,
      entreprise_id: currentUserRole === 'responsable_entreprise' ? (currentUserProfile?.entreprise_id || '') : prev.entreprise_id,
      region: prev.region || regions[0] || '',
    }));
    setIsStationDialogOpen(true);
  };

  return (
    <DashboardLayout
      title="Stations-service"
      subtitle="Surveillance des stocks en temps réel"
    >
      <div className="flex justify-between items-center mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">
              Toutes ({stations.length})
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-stock-critical data-[state=active]:text-stock-critical">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Critiques ({criticalCount})
            </TabsTrigger>
            <TabsTrigger value="warning" className="text-stock-warning data-[state=active]:text-stock-warning">
              Alertes ({warningCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 ml-4">
          {canCreateStation && (
            <Button size="sm" onClick={openStationDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle station
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les régions</SelectItem>
            {regionsList.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentUserRole === 'super_admin' && (
          <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Entreprise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les entreprises</SelectItem>
              {entreprises.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.sigle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stations Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <RefreshCw className="h-12 w-12 animate-spin mb-4 opacity-20" />
          <p>Chargement des stations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStations.map(station => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}

      {!loading && filteredStations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Aucune station trouvée</p>
          <p className="text-sm">Modifiez vos critères de recherche</p>
        </div>
      )}

      <Dialog open={isStationDialogOpen} onOpenChange={setIsStationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>Nouvelle station</DialogTitle>
              <DialogDescription>
                Renseignez les informations de la station-service. Les champs marqués d'une * sont obligatoires.
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              {/* Informations Générales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-1 text-primary">Informations Générales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom de la station *</Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Total Hamdallaye"
                      value={stationForm.nom}
                      onChange={(e) => setStationForm({ ...stationForm, nom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code Station *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: TE-HAM-001"
                      value={stationForm.code}
                      onChange={(e) => setStationForm({ ...stationForm, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ville">Ville *</Label>
                    <Input
                      id="ville"
                      placeholder="Conakry"
                      value={stationForm.ville}
                      onChange={(e) => setStationForm({ ...stationForm, ville: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Région *</Label>
                    <Select
                      value={stationForm.region}
                      onValueChange={(v) => setStationForm({ ...stationForm, region: v })}
                    >
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionsList.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse complète *</Label>
                  <Input
                    id="adresse"
                    placeholder="Quartier, Rue, Commune"
                    value={stationForm.adresse}
                    onChange={(e) => setStationForm({ ...stationForm, adresse: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de station</Label>
                    <Select
                      value={stationForm.type}
                      onValueChange={(v: 'urbaine' | 'routiere' | 'depot') => setStationForm({ ...stationForm, type: v })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urbaine">Urbaine</SelectItem>
                        <SelectItem value="routiere">Routière</SelectItem>
                        <SelectItem value="depot">Dépôt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currentUserRole === 'super_admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="entreprise">Entreprise *</Label>
                      <Select
                        value={stationForm.entreprise_id}
                        onValueChange={(v) => setStationForm({ ...stationForm, entreprise_id: v })}
                      >
                        <SelectTrigger id="entreprise">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          {entreprises.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.sigle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Capacités */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold border-b pb-1 text-primary">Capacités de Stockage (Litres)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cap_essence">Essence *</Label>
                    <Input
                      id="cap_essence"
                      type="number"
                      value={stationForm.capacite_essence}
                      onChange={(e) => setStationForm({ ...stationForm, capacite_essence: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cap_gasoil">Gasoil *</Label>
                    <Input
                      id="cap_gasoil"
                      type="number"
                      value={stationForm.capacite_gasoil}
                      onChange={(e) => setStationForm({ ...stationForm, capacite_gasoil: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cap_gpl">GPL</Label>
                    <Input
                      id="cap_gpl"
                      type="number"
                      value={(stationForm as any).capacite_gpl || 0}
                      onChange={(e) => setStationForm({ ...stationForm, capacite_gpl: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cap_lub">Lubrifiants</Label>
                    <Input
                      id="cap_lub"
                      type="number"
                      value={(stationForm as any).capacite_lubrifiants || 0}
                      onChange={(e) => setStationForm({ ...stationForm, capacite_lubrifiants: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Gestionnaire */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold border-b pb-1 text-primary">Informations du Gestionnaire</h3>
                <div className="space-y-2">
                  <Label htmlFor="gest_nom">Nom complet</Label>
                  <Input
                    id="gest_nom"
                    placeholder="Alpha Keita"
                    value={stationForm.gestionnaire_nom}
                    onChange={(e) => setStationForm({ ...stationForm, gestionnaire_nom: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gest_tel">Téléphone</Label>
                    <Input
                      id="gest_tel"
                      placeholder="+224 62X XX XX XX"
                      value={stationForm.gestionnaire_telephone}
                      onChange={(e) => setStationForm({ ...stationForm, gestionnaire_telephone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gest_email">Email</Label>
                    <Input
                      id="gest_email"
                      type="email"
                      placeholder="exemple@total.gn"
                      value={stationForm.gestionnaire_email}
                      onChange={(e) => setStationForm({ ...stationForm, gestionnaire_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 pt-2 border-t mt-auto">
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStationDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveStation} disabled={savingStation}>
                {savingStation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer la station'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
