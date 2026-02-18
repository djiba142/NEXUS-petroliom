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
import { regions, getEnterpriseLogo } from '@/data/mockData';
import { Station } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
// Import logos
import logoTotal from '@/assets/logos/total-energies.png';
import logoShell from '@/assets/logos/shell.jpg';
import logoTMI from '@/assets/logos/tmi.jpg';
import logoKP from '@/assets/logos/kamsar-petroleum.png';

export default function StationsPage() {
  const { role: currentUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string; sigle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsList, setRegionsList] = useState<string[]>([]);
  const [isStationDialogOpen, setIsStationDialogOpen] = useState(false);
  const [savingStation, setSavingStation] = useState(false);

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
    'Kamsar Petroleum': logoKP,
    'kamsar petroleum': logoKP,
  };

  const getLogoForEntreprise = (sigle: string, nom: string): string | undefined => {
    // Essayer d'abord avec le sigle
    if (localLogoMapping[sigle]) {
      return localLogoMapping[sigle];
    }
    // Essayer avec le nom
    if (localLogoMapping[nom]) {
      return localLogoMapping[nom];
    }
    // Essayer les variations du nom
    const nomVariations = [
      nom.split('(')[0].trim(), // "Vivo Energy Guinée"
      nom.split('-')[0].trim(), // Pour les noms avec tiret
    ];
    for (const variation of nomVariations) {
      if (localLogoMapping[variation]) {
        return localLogoMapping[variation];
      }
    }
    return undefined;
  };

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
      // Entreprises
      const { data: entData, error: entError } = await supabase
        .from('entreprises')
        .select('id, nom, sigle');
      if (entError) throw entError;
      setEntreprises(entData || []);

      // Stations
      let query = supabase.from('stations').select(`
        *,
        entreprises:entreprise_id(nom, sigle, logo_url)
      `);

      if (currentUserRole === 'responsable_entreprise' && currentUserProfile?.entreprise_id) {
        query = query.eq('entreprise_id', currentUserProfile.entreprise_id);
      }

      const { data: stData, error: stError } = await query;
      if (stError) throw stError;

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
        entrepriseLogo: s.entreprises?.logo_url ?? getLogoForEntreprise(s.entreprises?.sigle || '', s.entreprises?.nom || ''),
        capacite: {
          essence: s.capacite_essence || 0,
          gasoil: s.capacite_gasoil || 0,
          gpl: s.capacite_gpl || 0,
          lubrifiants: s.capacite_lubrifiants || 0,
        },
        stockActuel: {
          essence: s.stock_essence || 0,
          gasoil: s.stock_gasoil || 0,
          gpl: s.stock_gpl || 0,
          lubrifiants: s.stock_lubrifiants || 0,
        },
        nombrePompes: s.nombre_pompes || 0,
        gestionnaire: {
          nom: s.gestionnaire_nom || 'Non assigné',
          telephone: s.gestionnaire_telephone || '',
          email: s.gestionnaire_email || '',
        },
        statut: s.statut as any,
      }));

      setStations(mappedStations);

      const uniqueRegions = Array.from(new Set(mappedStations.map(s => s.region).filter(Boolean)));
      setRegionsList(uniqueRegions);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les stations',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch =
      s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || s.region === selectedRegion;
    const matchesEntreprise = selectedEntreprise === 'all' || s.entrepriseId === selectedEntreprise;

    if (activeTab === 'critical') {
      const essencePercent = s.capacite.essence > 0 ? Math.round((s.stockActuel.essence / s.capacite.essence) * 100) : 0;
      const gasoilPercent = s.capacite.gasoil > 0 ? Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100) : 0;
      return matchesSearch && matchesRegion && matchesEntreprise && (essencePercent < 10 || gasoilPercent < 10);
    }
    if (activeTab === 'warning') {
      const essencePercent = s.capacite.essence > 0 ? Math.round((s.stockActuel.essence / s.capacite.essence) * 100) : 0;
      const gasoilPercent = s.capacite.gasoil > 0 ? Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100) : 0;
      return matchesSearch && matchesRegion && matchesEntreprise &&
        ((essencePercent >= 10 && essencePercent < 25) || (gasoilPercent >= 10 && gasoilPercent < 25));
    }

    return matchesSearch && matchesRegion && matchesEntreprise;
  });

  const criticalCount = stations.filter(s => {
    const essencePercent = s.capacite.essence > 0 ? Math.round((s.stockActuel.essence / s.capacite.essence) * 100) : 0;
    const gasoilPercent = s.capacite.gasoil > 0 ? Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100) : 0;
    return essencePercent < 10 || gasoilPercent < 10;
  }).length;

  const warningCount = stations.filter(s => {
    const essencePercent = s.capacite.essence > 0 ? Math.round((s.stockActuel.essence / s.capacite.essence) * 100) : 0;
    const gasoilPercent = s.capacite.gasoil > 0 ? Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100) : 0;
    return (essencePercent >= 10 && essencePercent < 25) || (gasoilPercent >= 10 && gasoilPercent < 25);
  }).length;

  const canCreateStation =
    currentUserRole === 'super_admin' ||
    (currentUserRole === 'responsable_entreprise' && !!currentUserProfile?.entreprise_id);

  const handleSaveStation = async () => {
    const entrepriseId =
      currentUserRole === 'responsable_entreprise'
        ? currentUserProfile?.entreprise_id
        : stationForm.entreprise_id;

    const missing: string[] = [];
    if (!stationForm.nom?.trim()) missing.push('Nom');
    if (!stationForm.code?.trim()) missing.push('Code');
    if (!stationForm.adresse?.trim()) missing.push('Adresse');
    if (!stationForm.ville?.trim()) missing.push('Ville');
    if (!stationForm.region) missing.push('Région');
    if (!entrepriseId) missing.push('Entreprise');

    if (missing.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: `Veuillez remplir : ${missing.join(', ')}`,
      });
      return;
    }

    setSavingStation(true);

    try {
      const payload = {
        nom: stationForm.nom.trim(),
        code: stationForm.code.trim().toUpperCase(),
        adresse: stationForm.adresse.trim(),
        ville: stationForm.ville.trim(),
        region: stationForm.region,
        type: stationForm.type,
        entreprise_id: entrepriseId,
        capacite_essence: Number(stationForm.capacite_essence) || 0,
        capacite_gasoil: Number(stationForm.capacite_gasoil) || 0,
        capacite_gpl: 0,
        capacite_lubrifiants: 0,
        stock_essence: 0,
        stock_gasoil: 0,
        stock_gpl: 0,
        stock_lubrifiants: 0,
        statut: 'ouverte',
        gestionnaire_nom: stationForm.gestionnaire_nom?.trim() || null,
        gestionnaire_telephone: stationForm.gestionnaire_telephone?.trim() || null,
        gestionnaire_email: stationForm.gestionnaire_email?.trim() || null,
      };

      console.log('Payload envoyé à Supabase :', payload);

      const { error } = await supabase.from('stations').insert(payload);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${stationForm.nom} (${stationForm.code}) a été créée`,
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

      await fetchData();
    } catch (err: any) {
      console.error('Erreur création station :', err);
      toast({
        variant: 'destructive',
        title: 'Échec création',
        description: err?.message || 'Vérifiez la console (F12)',
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
    <DashboardLayout title="Stations-service" subtitle="Surveillance des stocks en temps réel">
      <div className="flex justify-between items-center mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">Toutes ({stations.length})</TabsTrigger>
            <TabsTrigger value="critical" className="text-red-600 data-[state=active]:text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Critiques ({criticalCount})
            </TabsTrigger>
            <TabsTrigger value="warning" className="text-amber-600 data-[state=active]:text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

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
                <SelectItem key={e.id} value={e.id}>{e.sigle || e.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p>Chargement des stations...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStations.map(station => (
              <Link key={station.id} to={`/stations/${station.id}`} className="block hover:scale-[1.02] transition-transform">
                <StationCard station={station} />
              </Link>
            ))}
          </div>

          {filteredStations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Aucune station trouvée</p>
              <p className="text-sm">Modifiez vos critères ou créez-en une nouvelle</p>
            </div>
          )}
        </>
      )}

      <Dialog open={isStationDialogOpen} onOpenChange={setIsStationDialogOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Nouvelle station-service</DialogTitle>
            <DialogDescription>
              Renseignez les informations principales de la station.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Nom de la station *</Label>
              <Input
                value={stationForm.nom}
                onChange={(e) => setStationForm({ ...stationForm, nom: e.target.value })}
                placeholder="Ex: Station Kipé"
              />
            </div>

            <div className="space-y-2">
              <Label>Code unique *</Label>
              <Input
                value={stationForm.code}
                onChange={(e) => setStationForm({ ...stationForm, code: e.target.value })}
                placeholder="Ex: CON-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Adresse complète *</Label>
              <Input
                value={stationForm.adresse}
                onChange={(e) => setStationForm({ ...stationForm, adresse: e.target.value })}
                placeholder="Ex: Avenue de la République, Kipé"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville *</Label>
                <Input
                  value={stationForm.ville}
                  onChange={(e) => setStationForm({ ...stationForm, ville: e.target.value })}
                  placeholder="Ex: Conakry"
                />
              </div>
              <div className="space-y-2">
                <Label>Région *</Label>
                <Select
                  value={stationForm.region}
                  onValueChange={(v) => setStationForm({ ...stationForm, region: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de station</Label>
              <Select
                value={stationForm.type}
                onValueChange={(v: 'urbaine' | 'routiere' | 'depot') => 
                  setStationForm({ ...stationForm, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urbaine">Urbaine</SelectItem>
                  <SelectItem value="routiere">Routière</SelectItem>
                  <SelectItem value="depot">Dépôt / Entrepôt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentUserRole === 'super_admin' && (
              <div className="space-y-2">
                <Label>Entreprise *</Label>
                <Select
                  value={stationForm.entreprise_id}
                  onValueChange={(v) => setStationForm({ ...stationForm, entreprise_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir l'entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {entreprises.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.sigle || e.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacité essence (litres)</Label>
                <Input
                  type="number"
                  min="0"
                  value={stationForm.capacite_essence || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStationForm({
                      ...stationForm,
                      capacite_essence: val === '' ? 0 : Number(val),
                    });
                  }}
                  placeholder="Ex: 50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacité gasoil (litres)</Label>
                <Input
                  type="number"
                  min="0"
                  value={stationForm.capacite_gasoil || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStationForm({
                      ...stationForm,
                      capacite_gasoil: val === '' ? 0 : Number(val),
                    });
                  }}
                  placeholder="Ex: 50000"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label>Gestionnaire de la station (optionnel)</Label>
              <Input
                placeholder="Nom complet du gestionnaire"
                value={stationForm.gestionnaire_nom}
                onChange={(e) => setStationForm({ ...stationForm, gestionnaire_nom: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-6 -mb-6 px-6 pb-6 border-t">
            <Button variant="outline" onClick={() => setIsStationDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveStation} disabled={savingStation}>
              {savingStation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Créer la station'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}