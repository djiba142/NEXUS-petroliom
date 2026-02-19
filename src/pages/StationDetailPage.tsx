import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, User, Fuel, Clock, Building2, Gauge, AlertTriangle, TrendingUp, Truck, Calendar, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockIndicator, StockBadge } from '@/components/dashboard/StockIndicator';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { mockAlerts, prixOfficiels } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Station } from '@/types';
import { cn } from '@/lib/utils';
// Import logos
import logoTotal from '@/assets/logos/total-energies.png';
import logoShell from '@/assets/logos/shell.jpg';
import logoTMI from '@/assets/logos/tmi.jpg';
import logoKP from '@/assets/logos/kamsar-petroleum.png';

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
  return capacity > 0 ? Math.round((current / capacity) * 100) : 0;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-GN').format(num);
}

const mockDeliveries = [
  { id: '1', date: '2026-01-30', carburant: 'Essence', quantite: 35000, fournisseur: 'SGPG', camion: 'GN-1234-AB', responsable: 'Amadou Bah' },
  { id: '2', date: '2026-01-25', carburant: 'Gasoil', quantite: 28000, fournisseur: 'SGPG', camion: 'GN-5678-CD', responsable: 'Mamadou Diallo' },
];

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localLogoMapping: Record<string, string> = {
    'TOTAL': logoTotal,
    'TotalEnergies': logoTotal,
    'TO': logoTotal,
    'SHELL': logoShell,
    'VIVO': logoShell,
    'SH': logoShell,
    'TMI': logoTMI,
    'TM': logoTMI,
    'KP': logoKP,
    'Kamsar Petroleum': logoKP,
    'kamsar petroleum': logoKP,
  };

  const getLogoForEntreprise = (sigle: string, nom: string): string | undefined => {
    // Essayer d'abord avec le sigle
    if (localLogoMapping[sigle]) {
      return localLogoMapping[sigle];
    }
    // Essayer avec le nom
    if (localLogoMapping[nom]) {
      return localLogoMapping[nom];
    }
    // Essayer les variations du nom
    const nomVariations = [
      nom.split('(')[0].trim(), // "Vivo Energy Guinée"
      nom.split('-')[0].trim(), // Pour les noms avec tiret
    ];
    for (const variation of nomVariations) {
      if (localLogoMapping[variation]) {
        return localLogoMapping[variation];
      }
    }
    return undefined;
  };

  useEffect(() => {
    const fetchStation = async () => {
      if (!id) {
        setError('Station ID manquant');
        setLoading(false);
        return;
      }

      try {
        const { data: stData, error: stError } = await supabase
          .from('stations')
          .select(`
            *,
            entreprises:entreprise_id(nom, sigle, logo_url)
          `)
          .eq('id', id)
          .single();

        if (stError) throw stError;
        if (!stData) {
          setError(`Aucune station trouvée avec l'ID "${id}"`);
          setLoading(false);
          return;
        }

        const mapped: Station = {
          id: stData.id,
          nom: stData.nom,
          code: stData.code,
          adresse: stData.adresse,
          ville: stData.ville,
          region: stData.region,
          type: stData.type as any,
          entrepriseId: stData.entreprise_id,
          entrepriseNom: stData.entreprises?.nom || 'Inconnu',
          entrepriseSigle: stData.entreprises?.sigle || '',
          entrepriseLogo: stData.entreprises?.logo_url ?? getLogoForEntreprise(stData.entreprises?.sigle || '', stData.entreprises?.nom || ''),
          capacite: {
            essence: stData.capacite_essence || 0,
            gasoil: stData.capacite_gasoil || 0,
            gpl: stData.capacite_gpl || 0,
            lubrifiants: stData.capacite_lubrifiants || 0,
          },
          stockActuel: {
            essence: stData.stock_essence || 0,
            gasoil: stData.stock_gasoil || 0,
            gpl: stData.stock_gpl || 0,
            lubrifiants: stData.stock_lubrifiants || 0,
          },
          nombrePompes: stData.nombre_pompes || 0,
          gestionnaire: {
            nom: stData.gestionnaire_nom || 'Non assigné',
            telephone: stData.gestionnaire_telephone || '',
            email: stData.gestionnaire_email || '',
          },
          statut: stData.statut as any,
        };

        setStation(mapped);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Erreur lors du chargement de la station';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [id]);

  const stationAlerts = station ? mockAlerts.filter(a => a.stationId === station.id && !a.resolu) : [];

  if (loading) {
    return (
      <DashboardLayout title="Chargement...">
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p>Chargement de la station...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !station) {
    return (
      <DashboardLayout title="Station non trouvée">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Station non trouvée</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            {error || `Aucune station trouvée avec l'ID "${id}" dans la base de données.`}
          </p>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/stations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          {/* Entreprise Logo */}
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-border overflow-hidden shadow-sm">
            {station.entrepriseLogo ? (
              <img
                src={station.entrepriseLogo}
                alt={`Logo ${station.entrepriseNom}`}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {station.entrepriseSigle?.substring(0, 2).toUpperCase() || 'ST'}
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{station.nom}</h1>
              <Badge className={cn("text-xs", statusStyles[station.statut] || 'bg-gray-100 text-gray-700')}>
                {statusLabels[station.statut] || station.statut || 'Inconnu'}
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
                    alert.niveau === 'critique' ? 'bg-red-600' : 'bg-amber-600'
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                    <p className="font-medium">{typeLabels[station.type] || station.type || 'Non défini'}</p>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  Niveaux de stock actuels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Essence</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.essence)} L / {formatNumber(station.capacite.essence)} L
                      </span>
                    </div>
                    <StockIndicator percentage={essencePercent} label="" size="md" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Gasoil</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.gasoil)} L / {formatNumber(station.capacite.gasoil)} L
                      </span>
                    </div>
                    <StockIndicator percentage={gasoilPercent} label="" size="md" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">GPL</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(station.stockActuel.gpl)} L / {formatNumber(station.capacite.gpl)} L
                      </span>
                    </div>
                    <StockIndicator percentage={gplPercent} label="" size="md" />
                  </div>

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

            <StockEvolutionChart stationId={id} title="Évolution des stocks de la station" />

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

          <div className="space-y-6">
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
                    {station.gestionnaire.telephone && (
                      <a 
                        href={`tel:${station.gestionnaire.telephone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {station.gestionnaire.telephone}
                      </a>
                    )}
                    {station.gestionnaire.email && (
                      <a 
                        href={`mailto:${station.gestionnaire.email}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {station.gestionnaire.email}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}