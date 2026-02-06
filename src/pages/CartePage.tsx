import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GuineaMap } from '@/components/map/GuineaMap';
import { mockStations, mockEntreprises, regions } from '@/data/mockData';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RefreshCw } from 'lucide-react';
import { NationalAutonomyGauge } from '@/components/charts/NationalAutonomyGauge';

export default function CartePage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  
  const filteredStations = mockStations.filter(station => {
    if (selectedRegion !== 'all' && station.region !== selectedRegion) return false;
    if (selectedEntreprise !== 'all' && station.entrepriseId !== selectedEntreprise) return false;
    return true;
  });

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
            {regions.map(region => (
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
            {mockEntreprises.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.sigle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
        
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredStations.length} station{filteredStations.length > 1 ? 's' : ''} affichée{filteredStations.length > 1 ? 's' : ''}
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
              {regions.slice(0, 5).map(region => {
                const count = mockStations.filter(s => s.region === region).length;
                return (
                  <div key={region} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{region}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
