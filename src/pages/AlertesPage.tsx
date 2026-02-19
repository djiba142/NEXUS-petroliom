import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertsList } from '@/components/dashboard/AlertCard';
import { mockAlerts } from '@/data/mockData';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AlertesPage() {
  const [filter, setFilter] = useState<'all' | 'critique' | 'alerte'>('all');
  const [selected, setSelected] = useState<typeof mockAlerts[number] | null>(null);

  const filteredAlerts = mockAlerts.filter(a => {
    if (filter === 'all') return true;
    return a.niveau === filter;
  });

  const handleResolve = (id: string) => {
    console.log('Résoudre alerte:', id);
    // TODO: Implement resolve logic
  };

  const handleSelect = (alert: typeof mockAlerts[number]) => {
    setSelected(alert);
  };

  const closeDetails = () => setSelected(null);

  return (
    <DashboardLayout 
      title="Alertes" 
      subtitle="Gestion des situations critiques"
    >
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">
            Toutes ({mockAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="critique" className="text-stock-critical data-[state=active]:text-stock-critical">
            Critiques ({mockAlerts.filter(a => a.niveau === 'critique').length})
          </TabsTrigger>
          <TabsTrigger value="alerte" className="text-stock-warning data-[state=active]:text-stock-warning">
            Alertes ({mockAlerts.filter(a => a.niveau === 'alerte').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="max-w-3xl">
        <AlertsList alerts={filteredAlerts} onResolve={handleResolve} onSelect={handleSelect} />
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'alerte</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'alerte sélectionnée
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 mt-2">
              <p className="text-sm font-semibold">{selected.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(selected.dateCreation).toLocaleString('fr-FR')}</p>
              <div className="text-sm">
                <p><strong>Station:</strong> {selected.stationNom}</p>
                <p><strong>Entreprise:</strong> {selected.entrepriseNom}</p>
                <p><strong>Niveau:</strong> {selected.niveau}</p>
                <p><strong>Résolu:</strong> {selected.resolu ? 'Oui' : 'Non'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDetails}>Fermer</Button>
              {selected && (
                <Button onClick={() => { handleResolve(selected.id); closeDetails(); }}>Marquer comme résolu</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
