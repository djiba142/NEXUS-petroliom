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
  FileText
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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
    { name: 'Base de données', status: 'operational', uptime: 99.9 },
    { name: 'API', status: 'operational', uptime: 99.8 },
    { name: 'Authentification', status: 'operational', uptime: 100 },
    { name: 'Storage', status: 'operational', uptime: 99.7 },
  ];

  const recentLogs = [
    { id: 1, type: 'info', message: 'Nouvel utilisateur créé: admin_dnh@sihg.gn', time: 'il y a 5 min' },
    { id: 2, type: 'warning', message: 'Tentative de connexion échouée: user@example.com', time: 'il y a 15 min' },
    { id: 3, type: 'success', message: 'Migration de base de données réussie', time: 'il y a 1h' },
    { id: 4, type: 'info', message: 'Prix officiels mis à jour par admin_etat', time: 'il y a 2h' },
    { id: 5, type: 'warning', message: 'Alerte stock critique: Station Total Kindia', time: 'il y a 3h' },
  ];

  return (
    <DashboardLayout 
      title="Dashboard Super Admin" 
      subtitle="Monitoring système et administration technique"
    >
      {/* System Status Banner */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-emerald-700">
            Tous les systèmes sont opérationnels
          </span>
          <span className="text-sm text-muted-foreground ml-auto">
            Dernière vérification: {new Date().toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Stats */}
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
          subtitle="enregistrées"
          icon={Database}
        />
        <StatCard
          title="Stations"
          value={stats.totalStations}
          subtitle="dans le système"
          icon={Server}
        />
        <StatCard
          title="Alertes actives"
          value={stats.totalAlertes}
          subtitle="non résolues"
          icon={AlertTriangle}
          variant={stats.totalAlertes > 5 ? 'warning' : 'default'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* System Health */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              État du Système
            </CardTitle>
            <CardDescription>
              Monitoring des services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.map((service, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.status === 'operational' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {service.uptime}% uptime
                  </span>
                </div>
                <Progress value={service.uptime} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Logs Récents
                </CardTitle>
                <CardDescription>
                  Activité système et sécurité
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'warning' ? 'bg-amber-500' :
                    log.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/utilisateurs">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium">Gestion Utilisateurs</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Créer et gérer les comptes
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/entreprises">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <Database className="h-6 w-6 text-emerald-500" />
              </div>
              <h4 className="font-medium">Entreprises</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Gérer les distributeurs
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/parametres">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                <Settings className="h-6 w-6 text-amber-500" />
              </div>
              <h4 className="font-medium">Paramètres</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Configuration système
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/alertes">
            <CardContent className="flex flex-col items-center py-6">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
              <h4 className="font-medium">Sécurité</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Alertes et audit
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </DashboardLayout>
  );
}
