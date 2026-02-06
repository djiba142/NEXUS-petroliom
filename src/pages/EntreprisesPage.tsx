import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EntrepriseCard } from '@/components/entreprises/EntrepriseCard';
import { mockEntreprises, regions } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EntreprisesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredEntreprises = mockEntreprises.filter(e => {
    const matchesSearch = e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.sigle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || e.region === selectedRegion;
    const matchesType = selectedType === 'all' || e.type === selectedType;
    return matchesSearch && matchesRegion && matchesType;
  });

  return (
    <DashboardLayout 
      title="Entreprises" 
      subtitle="Gestion des distributeurs d'hydrocarbures"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entreprise..."
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

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="compagnie">Compagnie</SelectItem>
            <SelectItem value="distributeur">Distributeur</SelectItem>
          </SelectContent>
        </Select>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-secondary/50 rounded-xl">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{filteredEntreprises.length}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Actives</p>
          <p className="text-2xl font-bold text-stock-healthy">
            {filteredEntreprises.filter(e => e.statut === 'actif').length}
          </p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Stations totales</p>
          <p className="text-2xl font-bold">
            {filteredEntreprises.reduce((sum, e) => sum + e.nombreStations, 0)}
          </p>
        </div>
      </div>

      {/* Entreprises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEntreprises.map(entreprise => (
          <EntrepriseCard key={entreprise.id} entreprise={entreprise} />
        ))}
      </div>

      {filteredEntreprises.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Aucune entreprise trouvée</p>
          <p className="text-sm">Modifiez vos critères de recherche</p>
        </div>
      )}
    </DashboardLayout>
  );
}
