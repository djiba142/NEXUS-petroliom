import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertsList } from '@/components/dashboard/AlertCard';
import { mockAlerts } from '@/data/mockData';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AlertesPage() {
  const [filter, setFilter] = useState<'all' | 'critique' | 'alerte'>('all');

  const filteredAlerts = mockAlerts.filter(a => {
    if (filter === 'all') return true;
    return a.niveau === filter;
  });

  const handleResolve = (id: string) => {
    console.log('Résoudre alerte:', id);
    // TODO: Implement resolve logic
  };

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
        <AlertsList alerts={filteredAlerts} onResolve={handleResolve} />
      </div>
    </DashboardLayout>
  );
}
