import { useState, useEffect } from 'react';
import { Search, Filter, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Station } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function StationsPage() {
  const { role: currentUserRole, profile: currentUserProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [entreprises, setEntreprises] = useState<{ id: string, nom: string, sigle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsList, setRegionsList] = useState<string[]>([]);

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
        entreprises:entreprise_id(nom, sigle)
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

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="ml-4 gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
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
    </DashboardLayout>
  );
}
