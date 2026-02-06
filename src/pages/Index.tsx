import { 
  Building2, 
  Fuel, 
  AlertTriangle, 
  AlertCircle,
  Activity,
  Droplets,
  Ship,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { StockIndicator } from '@/components/dashboard/StockIndicator';
import { AlertsList } from '@/components/dashboard/AlertCard';
import { StationCard } from '@/components/stations/StationCard';
import { GuineaMap } from '@/components/map/GuineaMap';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { NationalAutonomyGauge } from '@/components/charts/NationalAutonomyGauge';
import { mockDashboardStats, mockAlerts, mockStations } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '@/contexts/AuthContext';

// Mock import tracking data
const mockImports = [
  { id: 1, navire: 'MT Conakry Star', cargaison: '30 000 tonnes Gasoil', status: 'En route', eta: '3 jours' },
  { id: 2, navire: 'MT Atlantic Pride', cargaison: '15 000 tonnes Essence', status: 'Déchargement', eta: 'Au port' },
];

const Index = () => {
  const { profile, role } = useAuth();
  const stats = mockDashboardStats;
  const criticalStations = mockStations.filter(s => {
    const essencePercent = Math.round((s.stockActuel.essence / s.capacite.essence) * 100);
    const gasoilPercent = Math.round((s.stockActuel.gasoil / s.capacite.gasoil) * 100);
    return essencePercent < 25 || gasoilPercent < 25;
  });

  return (
    <DashboardLayout 
      title="Tableau de bord" 
      subtitle="Vue d'ensemble nationale des hydrocarbures"
    >
      {/* Welcome Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display mb-1">
              Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''} !
            </h2>
            <p className="text-primary-foreground/80">
              {role && `${ROLE_LABELS[role]} • `}SIHG — Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" asChild>
              <Link to="/rapports">Générer un rapport</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* National Autonomy Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <NationalAutonomyGauge daysRemaining={12} fuelType="essence" />
        <NationalAutonomyGauge daysRemaining={15} fuelType="gasoil" />
        <StatCard
          title="Alertes critiques"
          value={stats.alertesCritiques}
          subtitle="ruptures imminentes"
          icon={AlertCircle}
          variant="critical"
        />
        <StatCard
          title="Alertes niveau"
          value={stats.alertesWarning}
          subtitle="stocks bas"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Entreprises"
          value={stats.totalEntreprises}
          subtitle="agréées en activité"
          icon={Building2}
        />
        <StatCard
          title="Stations actives"
          value={`${stats.stationsActives}/${stats.totalStations}`}
          subtitle="opérationnelles"
          icon={Fuel}
          trend={{ value: 2.5, positive: true }}
        />
        <StatCard
          title="Stock Essence"
          value={`${stats.stockNationalEssence}%`}
          subtitle="niveau national"
          icon={Droplets}
          variant={stats.stockNationalEssence < 50 ? 'warning' : 'success'}
        />
        <StatCard
          title="Stock Gasoil"
          value={`${stats.stockNationalGasoil}%`}
          subtitle="niveau national"
          icon={Droplets}
          variant="success"
        />
      </div>

      {/* Map & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="stat-card p-0 overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg font-display">Carte de Vigilance</h3>
                  <p className="text-sm text-muted-foreground">Stations par niveau de stock</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/carte">Voir la carte complète</Link>
                </Button>
              </div>
            </div>
            <GuineaMap stations={mockStations} height="350px" showControls={false} />
          </div>
        </div>

        {/* Import Tracking - SONAP Dashboard */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg font-display">Suivi Importations</h3>
              <p className="text-sm text-muted-foreground">Pipeline maritime</p>
            </div>
            <Ship className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {mockImports.map(imp => (
              <div key={imp.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{imp.navire}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imp.status === 'En route' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {imp.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{imp.cargaison}</p>
                <p className="text-xs font-medium mt-1">ETA: {imp.eta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StockEvolutionChart title="Évolution Stock National" />
        
        {/* Quick Stats */}
        <div className="stat-card bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <h3 className="font-semibold text-lg font-display mb-4">Prix Officiels (GNF/L)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Droplets className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-muted-foreground">Essence</span>
              </div>
              <span className="font-bold text-lg">12 000 GNF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Droplets className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-muted-foreground">Gasoil</span>
              </div>
              <span className="font-bold text-lg">12 000 GNF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-card rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-muted-foreground">GPL</span>
              </div>
              <span className="font-bold text-lg">8 500 GNF</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Prix fixés par arrêté ministériel du 15/01/2026
          </p>
        </div>
      </div>

      {/* Alerts & Critical Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg font-display">Alertes Actives</h3>
              <p className="text-sm text-muted-foreground">Situations nécessitant attention</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/alertes">Voir tout</Link>
            </Button>
          </div>
          <AlertsList alerts={mockAlerts} maxItems={3} />
        </div>

        {/* Critical Stations */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg font-display">Stations en Alerte</h3>
              <p className="text-sm text-muted-foreground">Nécessitent ravitaillement prioritaire</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/stations">Voir tout</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {criticalStations.slice(0, 3).map(station => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
