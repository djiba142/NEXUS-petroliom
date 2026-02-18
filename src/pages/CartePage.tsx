import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GuineaMap } from '@/components/map/GuineaMap';
import { supabase } from '@/integrations/supabase/client';
import { Station } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RefreshCw, Loader2 } from 'lucide-react';
import { NationalAutonomyGauge } from '@/components/charts/NationalAutonomyGauge';

// Guinean regions list (administrative)
const REGIONS = [
  'Conakry', 'Boké', 'Kindia', 'Mamou', 'Labé',
  'Faranah', 'Kankan', 'N\'Zérékoré',
];

export default function CartePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string; sigle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stations with entreprise join
      const { data: stData } = await supabase
        .from('stations')
        .select(`
          id, nom, code, adresse, ville, region, type, statut,
          nombre_pompes,
          stock_essence, stock_gasoil, stock_gpl, stock_lubrifiants,
          capacite_essence, capacite_gasoil, capacite_gpl, capacite_lubrifiants,
          latitude, longitude,
          gestionnaire_nom, gestionnaire_telephone, gestionnaire_email,
          entreprise_id,
          entreprise:entreprises!entreprise_id(id, nom, sigle)
        `)
        .order('nom');

      // Map Supabase flat rows → Station type (nested shape expected by GuineaMap)
      const mapped: Station[] = (stData || []).map((s: any) => ({
        id: s.id,
        nom: s.nom,
        code: s.code || '',
        adresse: s.adresse || '',
        ville: s.ville || '',
        region: s.region || '',
        type: s.type || 'urbaine',
        statut: s.statut || 'ouverte',
        entrepriseId: s.entreprise_id || '',
        entrepriseNom: s.entreprise?.nom || '',
        nombrePompes: s.nombre_pompes || 0,
        coordonnees: (s.latitude && s.longitude)
          ? { lat: s.latitude, lng: s.longitude }
          : undefined,
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
        gestionnaire: {
          nom: s.gestionnaire_nom || '',
          telephone: s.gestionnaire_telephone || '',
          email: s.gestionnaire_email || '',
        },
      }));

      setStations(mapped);

      // Build unique entreprise list from stations
      const uniqueEntreprises = Array.from(
        new Map(
          (stData || [])
            .filter((s: any) => s.entreprise)
            .map((s: any) => [s.entreprise.id, s.entreprise])
        ).values()
      ) as { id: string; nom: string; sigle: string }[];

      setEntreprises(uniqueEntreprises.sort((a, b) => a.sigle.localeCompare(b.sigle)));
    } catch (err) {
      console.error('CartePage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Filtered stations ───
  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      if (selectedRegion !== 'all' && s.region !== selectedRegion) return false;
      if (selectedEntreprise !== 'all' && s.entrepriseId !== selectedEntreprise) return false;
      return true;
    });
  }, [stations, selectedRegion, selectedEntreprise]);

  // ─── Region counts (from all stations, not filtered) ───
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stations.forEach(s => {
      counts[s.region] = (counts[s.region] || 0) + 1;
    });
    return counts;
  }, [stations]);

  // ─── Unique regions from actual data ───
  const availableRegions = useMemo(() => {
    const fromData = Array.from(new Set(stations.map(s => s.region).filter(Boolean))).sort();
    // Merge with known regions list, data takes priority
    const merged = Array.from(new Set([...fromData, ...REGIONS])).sort();
    return merged;
  }, [stations]);

  return (
    <DashboardLayout
      title="Carte Nationale"
      subtitle="Visualisation géographique des stations et niveaux de stock"
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>

        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les régions</SelectItem>
            {availableRegions.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {entreprises.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.sigle}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement...
            </span>
          ) : (
            `${filteredStations.length} station${filteredStations.length > 1 ? 's' : ''} affichée${filteredStations.length > 1 ? 's' : ''}`
          )}
        </div>
      </div>

      {/* Map and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <GuineaMap stations={filteredStations} height="600px" />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg font-display">Autonomie Nationale</h3>
          <NationalAutonomyGauge daysRemaining={12} fuelType="essence" />
          <NationalAutonomyGauge daysRemaining={15} fuelType="gasoil" />

          {/* Region Stats */}
          <div className="stat-card">
            <h4 className="font-medium mb-3">Stations par Région</h4>
            <div className="space-y-2">
              {Object.entries(regionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{region}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              {Object.keys(regionCounts).length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
