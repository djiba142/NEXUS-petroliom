import { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  FileText,
  Map as MapIcon,
  Ship,
  TrendingUp,
  Droplets
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { NationalAutonomyGauge } from '@/components/charts/NationalAutonomyGauge';
import { GuineaMap } from '@/components/map/GuineaMap';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { mockStations } from '@/data/mockData';

interface SystemStats {
  totalUsers: number;
  totalEntreprises: number;
  totalStations: number;
  totalAlertes: number;
}

export default function DashboardSuperAdmin() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalEntreprises: 0,
    totalStations: 0,
    totalAlertes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Constantes de consommation (mêmes que SONAP)
  const CONSOMMATION_JOURNALIERE = {
    essence: 800000,
    gasoil: 1200000,
    gpl: 100000,
  };

  // État pour les stocks réels (simulé ici avec mockStations pour l'instant, mais prêt à être connecté)
  const stockNational = mockStations.reduce((acc, station) => ({
    essence: acc.essence + (station.stockActuel.essence || 0),
    gasoil: acc.gasoil + (station.stockActuel.gasoil || 0),
    gpl: acc.gpl + (station.stockActuel.gpl || 0),
  }), { essence: 0, gasoil: 0, gpl: 0 });

  const autonomie = {
    essence: Math.round(stockNational.essence / CONSOMMATION_JOURNALIERE.essence),
    gasoil: Math.round(stockNational.gasoil / CONSOMMATION_JOURNALIERE.gasoil),
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: entreprisesCount },
        { count: stationsCount },
        { count: alertesCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('entreprises').select('*', { count: 'exact', head: true }),
        supabase.from('stations').select('*', { count: 'exact', head: true }),
        supabase.from('alertes').select('*', { count: 'exact', head: true }).eq('resolu', false),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalEntreprises: entreprisesCount || 0,
        totalStations: stationsCount || 0,
        totalAlertes: alertesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const systemHealth = [
    { name: 'Base de données (Supabase)', status: 'operational', uptime: 100 },
    { name: 'Edge Functions', status: 'operational', uptime: 99.9 },
    { name: 'Stockage (Buckets)', status: 'operational', uptime: 100 },
    { name: 'Auth Server', status: 'operational', uptime: 100 },
  ];

  return (
    <DashboardLayout
      title="Superviseur Général"
      subtitle="Vue d'ensemble technique et opérationnelle (Mode Dieu)"
    >
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          subtitle="comptes actifs"
          icon={Users}
        />
        <StatCard
          title="Entreprises"
          value={stats.totalEntreprises}
          subtitle="distributeurs agréés"
          icon={Database}
        />
        <StatCard
          title="Stations"
          value={stats.totalStations}
          subtitle="points de vente"
          icon={Server}
        />
        <StatCard
          title="Sécurité"
          value={stats.totalAlertes}
          subtitle="incidents ouverts"
          icon={AlertTriangle}
          variant={stats.totalAlertes > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* National Dashboard Section (Merged from SONAP) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          État National des Stocks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <NationalAutonomyGauge daysRemaining={autonomie.essence} fuelType="essence" />
          <NationalAutonomyGauge daysRemaining={autonomie.gasoil} fuelType="gasoil" />

          <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ship className="h-5 w-5 text-primary" />
                Importations en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-background/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Ship className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">MT Conakry Star</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                    En approche (24h)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Ship className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Ocean Pride</span>
                  </div>
                  <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                    Au mouillage
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Actions Grid */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        Administration Système
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group">
          <Link to="/utilisateurs">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Gérer les Utilisateurs</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Création de comptes, Rôles, Permissions
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group">
          <Link to="/entreprises">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Gérer les Entités</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Entreprises, Stations, Dépôts
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group">
          <Link to="/dashboard/sgp">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="font-medium">Prix & Logistique</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Configurer les prix officiels et les ordres
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group">
          <Link to="/alertes">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-medium">Centre de Sécurité</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Audit logs, Alertes critiques
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Technical Monitoring */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Server className="h-5 w-5 text-primary" />
        Monitoring Technique
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Santé de l'Infrastructure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.map((service, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">100%</span>
                </div>
                <Progress value={service.uptime} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Carte de Vigilance (Live)</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/carte">Plein écran</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full">
              <GuineaMap stations={mockStations} height="100%" showControls={false} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
