import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, User, Fuel, Clock, Building2, Gauge, AlertTriangle, TrendingUp, Truck, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockIndicator, StockBadge } from '@/components/dashboard/StockIndicator';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { mockStations, mockAlerts, prixOfficiels } from '@/data/mockData';
import { cn } from '@/lib/utils';

const typeLabels = {
  urbaine: 'Urbaine',
  routiere: 'Routière',
  depot: 'Dépôt'
};

const statusStyles = {
  ouverte: 'bg-emerald-100 text-emerald-700',
  fermee: 'bg-red-100 text-red-700',
  en_travaux: 'bg-amber-100 text-amber-700',
  attente_validation: 'bg-blue-100 text-blue-700'
};

const statusLabels = {
  ouverte: 'Ouverte',
  fermee: 'Fermée',
  en_travaux: 'En travaux',
  attente_validation: 'En attente de validation'
};

function calculatePercentage(current: number, capacity: number): number {
  return Math.round((current / capacity) * 100);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-GN').format(num);
}

// Mock delivery history for demo
const mockDeliveries = [
  { id: '1', date: '2026-01-30', carburant: 'Essence', quantite: 35000, fournisseur: 'SGPG', camion: 'GN-1234-AB', responsable: 'Amadou Bah' },
  { id: '2', date: '2026-01-25', carburant: 'Gasoil', quantite: 28000, fournisseur: 'SGPG', camion: 'GN-5678-CD', responsable: 'Mamadou Diallo' },
  { id: '3', date: '2026-01-20', carburant: 'Essence', quantite: 30000, fournisseur: 'SGPG', camion: 'GN-9012-EF', responsable: 'Ibrahim Sow' },
  { id: '4', date: '2026-01-15', carburant: 'GPL', quantite: 8000, fournisseur: 'SGPG', camion: 'GN-3456-GH', responsable: 'Oumar Barry' },
];

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const station = mockStations.find(s => s.id === id);
  const stationAlerts = mockAlerts.filter(a => a.stationId === id && !a.resolu);

  if (!station) {
    return (
      <DashboardLayout title="Station non trouvée">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Station non trouvée</h2>
          <p className="text-muted-foreground mb-4">La station demandée n'existe pas.</p>
          <Button asChild>
            <Link to="/stations">Retour aux stations</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const essencePercent = calculatePercentage(station.stockActuel.essence, station.capacite.essence);
  const gasoilPercent = calculatePercentage(station.stockActuel.gasoil, station.capacite.gasoil);
  const gplPercent = calculatePercentage(station.stockActuel.gpl, station.capacite.gpl);
  const lubrifiantsPercent = calculatePercentage(station.stockActuel.lubrifiants, station.capacite.lubrifiants);

  return (
    <DashboardLayout title={station.nom} subtitle={`${station.code} - ${station.ville}`}>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/stations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{station.nom}</h1>
              <Badge className={cn("text-xs", statusStyles[station.statut])}>
                {statusLabels[station.statut]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono bg-secondary px-2 py-0.5 rounded">{station.code}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {station.adresse}, {station.ville}
              </span>
            </div>
          </div>
          <StockBadge percentage={Math.min(essencePercent, gasoilPercent)} size="lg" />
        </div>

        {/* Alerts Banner */}
        {stationAlerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                {stationAlerts.length} alerte{stationAlerts.length > 1 ? 's' : ''} active{stationAlerts.length > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="space-y-2">
              {stationAlerts.map(alert => (
                <div key={alert.id} className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    alert.niveau === 'critique' ? 'bg-stock-critical' : 'bg-stock-warning'
                  )} />
                  <span className="text-foreground">{alert.message}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(alert.dateCreation).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Stocks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Informations générales */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type de station</p>
                    <p className="font-medium">{typeLabels[station.type]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Entreprise</p>
                    <Link to={`/entreprises/${station.entrepriseId}`} className="font-medium text-primary hover:underline">
                      {station.entrepriseNom}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nombre de pompes</p>
                    <p className="font-medium flex items-center gap-1">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      {station.nombrePompes} pompes
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Région</p>
                    <p className="font-medium">{station.region}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ville</p>
                    <p className="font-medium">{station.ville}</p>
                  </div>
                  {station.coordonnees && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Coordonnées GPS</p>
                      <p className="font-mono text-sm">{station.coordonnees.lat}, {station.coordonnees.lng}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Stocks actuels */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  Niveaux de stock actuels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Essence */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Essence</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.essence)} L / {formatNumber(station.capacite.essence)} L
                      </span>
                    </div>
                    <StockIndicator percentage={essencePercent} label="" size="md" />
                  </div>

                  {/* Gasoil */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Gasoil</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.gasoil)} L / {formatNumber(station.capacite.gasoil)} L
                      </span>
                    </div>
                    <StockIndicator percentage={gasoilPercent} label="" size="md" />
                  </div>

                  {/* GPL */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">GPL</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.gpl)} L / {formatNumber(station.capacite.gpl)} L
                      </span>
                    </div>
                    <StockIndicator percentage={gplPercent} label="" size="md" />
                  </div>

                  {/* Lubrifiants */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Lubrifiants</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.lubrifiants)} L / {formatNumber(station.capacite.lubrifiants)} L
                      </span>
                    </div>
                    <StockIndicator percentage={lubrifiantsPercent} label="" size="md" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Evolution Chart */}
            <StockEvolutionChart 
              stationId={id} 
              title="Évolution des stocks de la station" 
            />

            {/* Section 3: Historique des livraisons */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  Historique des livraisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Carburant</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Quantité</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Fournisseur</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Camion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockDeliveries.map(delivery => (
                        <tr key={delivery.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {new Date(delivery.date).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline">{delivery.carburant}</Badge>
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            {formatNumber(delivery.quantite)} L
                          </td>
                          <td className="py-3 px-2">{delivery.fournisseur}</td>
                          <td className="py-3 px-2 font-mono text-xs">{delivery.camion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Manager, Prices, Capacities */}
          <div className="space-y-6">
            {/* Prix officiels */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Prix officiels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span>Essence</span>
                    <span className="font-mono font-semibold">{formatNumber(prixOfficiels.essence)} GNF/L</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span>Gasoil</span>
                    <span className="font-mono font-semibold">{formatNumber(prixOfficiels.gasoil)} GNF/L</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>GPL</span>
                    <span className="font-mono font-semibold">{formatNumber(prixOfficiels.gpl)} GNF/L</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestionnaire */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Gestionnaire de station
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{station.gestionnaire.nom}</p>
                      <p className="text-sm text-muted-foreground">Gestionnaire</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <a 
                      href={`tel:${station.gestionnaire.telephone}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {station.gestionnaire.telephone}
                    </a>
                    <a 
                      href={`mailto:${station.gestionnaire.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {station.gestionnaire.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacités de stockage */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  Capacités de stockage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm">Essence</span>
                    <span className="font-mono text-sm">{formatNumber(station.capacite.essence)} L</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm">Gasoil</span>
                    <span className="font-mono text-sm">{formatNumber(station.capacite.gasoil)} L</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm">GPL</span>
                    <span className="font-mono text-sm">{formatNumber(station.capacite.gpl)} L</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Lubrifiants</span>
                    <span className="font-mono text-sm">{formatNumber(station.capacite.lubrifiants)} L</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dernière livraison */}
            {station.derniereLivraison && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Dernière livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Date</span>
                      <span className="font-medium">
                        {new Date(station.derniereLivraison.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Carburant</span>
                      <Badge variant="outline">{station.derniereLivraison.carburant}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Quantité</span>
                      <span className="font-mono">{formatNumber(station.derniereLivraison.quantite)} L</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
