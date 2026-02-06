import { useState } from 'react';
import { Search, Filter, Plus, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StationCard } from '@/components/stations/StationCard';
import { mockStations, mockEntreprises, regions } from '@/data/mockData';
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

export default function StationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredStations = mockStations.filter(s => {
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

  const criticalCount = mockStations.filter(s => {
    const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
    const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
    return essencePercent < 10 || gasoilPercent < 10;
  }).length;

  const warningCount = mockStations.filter(s => {
    const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
    const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
    return (essencePercent >= 10 && essencePercent < 25) || (gasoilPercent >= 10 && gasoilPercent < 25);
  }).length;

  return (
    <DashboardLayout 
      title="Stations-service" 
      subtitle="Surveillance des stocks en temps réel"
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">
            Toutes ({mockStations.length})
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
            {regions.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {mockEntreprises.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.sigle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStations.map(station => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Aucune station trouvée</p>
          <p className="text-sm">Modifiez vos critères de recherche</p>
        </div>
      )}
    </DashboardLayout>
  );
}
