import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, User, Fuel, Clock,
  Building2, Gauge, AlertTriangle, TrendingUp, Truck,
  Calendar, Loader2, CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockIndicator, StockBadge } from '@/components/dashboard/StockIndicator';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ─── Local logo fallback ───
import logoTotal from '@/assets/logos/total-energies.png';
import logoShell from '@/assets/logos/shell.jpg';
import logoTMI from '@/assets/logos/tmi.jpg';
import logoKP from '@/assets/logos/kamsar-petroleum.png';

const localLogoMapping: Record<string, string> = {
  TOTAL: logoTotal, TotalEnergies: logoTotal, TO: logoTotal,
  SHELL: logoShell, VIVO: logoShell, SH: logoShell,
  TMI: logoTMI, TM: logoTMI,
  KP: logoKP,
};

// ─── Types ───
interface StationDetail {
  id: string;
  nom: string;
  code: string;
  adresse: string;
  ville: string;
  region: string;
  type: string;
  statut: string;
  nombre_pompes: number;
  stock_essence: number;
  stock_gasoil: number;
  stock_gpl: number;
  stock_lubrifiants: number;
  capacite_essence: number;
  capacite_gasoil: number;
  capacite_gpl: number;
  capacite_lubrifiants: number;
  gestionnaire_nom: string | null;
  gestionnaire_telephone: string | null;
  gestionnaire_email: string | null;
  entreprise_id: string;
  entreprise?: {
    id: string;
    nom: string;
    sigle: string;
    logo_url: string | null;
  } | null;
}

interface AlerteRow {
  id: string;
  message: string;
  niveau: string;
  type: string;
  created_at: string;
  resolu: boolean;
}

interface LivraisonRow {
  id: string;
  created_at: string;
  type_carburant: string;
  quantite: number;
  fournisseur: string | null;
  numero_camion: string | null;
}

// ─── Constants ───
const typeLabels: Record<string, string> = {
  urbaine: 'Urbaine',
  routiere: 'Routière',
  depot: 'Dépôt',
};

const statusStyles: Record<string, string> = {
  ouverte: 'bg-emerald-100 text-emerald-700',
  fermee: 'bg-red-100 text-red-700',
  en_travaux: 'bg-amber-100 text-amber-700',
  attente_validation: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<string, string> = {
  ouverte: 'Ouverte',
  fermee: 'Fermée',
  en_travaux: 'En travaux',
  attente_validation: 'En attente de validation',
};

// Prix officiels (constants réglementaires)
const prixOfficiels = { essence: 12000, gasoil: 11000, gpl: 8000 };

function calculatePercentage(current: number, capacity: number): number {
  return capacity > 0 ? Math.round((current / capacity) * 100) : 0;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-GN').format(num);
}

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [alerts, setAlerts] = useState<AlerteRow[]>([]);
  const [livraisons, setLivraisons] = useState<LivraisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch station with entreprise join
      const { data: stData, error: stErr } = await supabase
        .from('stations')
        .select(`
          *,
          entreprise:entreprises!entreprise_id(id, nom, sigle, logo_url)
        `)
        .eq('id', id)
        .maybeSingle();

      if (stErr) throw stErr;
      if (!stData) {
        setError(`Aucune station trouvée avec l'ID "${id}"`);
        setLoading(false);
        return;
      }
      setStation(stData as StationDetail);

      // Fetch active alerts for this station
      const { data: alertData } = await supabase
        .from('alertes')
        .select('id, message, niveau, type, created_at, resolu')
        .eq('station_id', id)
        .eq('resolu', false)
        .order('created_at', { ascending: false });

      setAlerts(alertData || []);

      // Fetch recent deliveries (mouvements_stock table if exists, else skip)
      const { data: livData } = await supabase
        .from('mouvements_stock')
        .select('id, created_at, type_carburant, quantite, fournisseur, numero_camion')
        .eq('station_id', id)
        .eq('type_mouvement', 'livraison')
        .order('created_at', { ascending: false })
        .limit(10);

      setLivraisons(livData || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la station.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <DashboardLayout title="Chargement...">
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement de la station...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Not found ───
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

  // ─── Computed values ───
  const essencePercent = calculatePercentage(station.stock_essence, station.capacite_essence);
  const gasoilPercent = calculatePercentage(station.stock_gasoil, station.capacite_gasoil);
  const gplPercent = calculatePercentage(station.stock_gpl, station.capacite_gpl);
  const lubrifiantsPercent = calculatePercentage(station.stock_lubrifiants, station.capacite_lubrifiants);

  const entrepriseLogo = station.entreprise?.logo_url
    || (station.entreprise?.sigle ? localLogoMapping[station.entreprise.sigle] : null)
    || null;

  return (
    <DashboardLayout title={station.nom} subtitle={`${station.code} - ${station.ville}`}>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/stations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          {/* Entreprise Logo */}
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-border overflow-hidden shadow-sm">
            {entrepriseLogo ? (
              <img
                src={entrepriseLogo}
                alt={`Logo ${station.entreprise?.sigle}`}
                className="h-10 w-10 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {station.entreprise?.sigle?.substring(0, 2).toUpperCase() || 'ST'}
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

        {/* ── Active Alerts Banner ── */}
        {alerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                {alerts.length} alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    alert.niveau === 'critique' ? 'bg-red-600' : 'bg-amber-600'
                  )} />
                  <span className="text-foreground">{alert.message}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {new Date(alert.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Main info ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* General info */}
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
                    <Link
                      to={`/entreprises/${station.entreprise_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {station.entreprise?.nom || '—'}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nombre de pompes</p>
                    <p className="font-medium flex items-center gap-1">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      {station.nombre_pompes} pompes
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
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                    <p className="font-medium text-sm">{station.adresse || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock levels */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  Niveaux de stock actuels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { label: 'Essence', current: station.stock_essence, capacity: station.capacite_essence, percent: essencePercent },
                    { label: 'Gasoil', current: station.stock_gasoil, capacity: station.capacite_gasoil, percent: gasoilPercent },
                    { label: 'GPL', current: station.stock_gpl, capacity: station.capacite_gpl, percent: gplPercent },
                    { label: 'Lubrifiants', current: station.stock_lubrifiants, capacity: station.capacite_lubrifiants, percent: lubrifiantsPercent },
                  ].map(fuel => (
                    <div key={fuel.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{fuel.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(fuel.current)} L / {formatNumber(fuel.capacity)} L
                        </span>
                      </div>
                      <StockIndicator percentage={fuel.percent} label="" size="md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock evolution chart */}
            <StockEvolutionChart stationId={id} title="Évolution des stocks de la station" />

            {/* Deliveries */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  Historique des livraisons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {livraisons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune livraison enregistrée</p>
                  </div>
                ) : (
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
                        {livraisons.map(liv => (
                          <tr key={liv.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {new Date(liv.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline">{liv.type_carburant}</Badge>
                            </td>
                            <td className="py-3 px-2 text-right font-mono">
                              {formatNumber(liv.quantite)} L
                            </td>
                            <td className="py-3 px-2">{liv.fournisseur || '—'}</td>
                            <td className="py-3 px-2 font-mono text-xs">{liv.numero_camion || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Sidebar ── */}
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
                      <p className="font-semibold">{station.gestionnaire_nom || 'Non assigné'}</p>
                      <p className="text-sm text-muted-foreground">Gestionnaire</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    {station.gestionnaire_telephone && (
                      <a
                        href={`tel:${station.gestionnaire_telephone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {station.gestionnaire_telephone}
                      </a>
                    )}
                    {station.gestionnaire_email && (
                      <a
                        href={`mailto:${station.gestionnaire_email}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {station.gestionnaire_email}
                      </a>
                    )}
                    {!station.gestionnaire_telephone && !station.gestionnaire_email && (
                      <p className="text-sm text-muted-foreground">Aucune coordonnée disponible</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacités */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  Capacités de stockage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Essence', value: station.capacite_essence },
                    { label: 'Gasoil', value: station.capacite_gasoil },
                    { label: 'GPL', value: station.capacite_gpl },
                    { label: 'Lubrifiants', value: station.capacite_lubrifiants },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex justify-between items-center py-2",
                        i < arr.length - 1 && "border-b border-border/50"
                      )}
                    >
                      <span className="text-sm">{item.label}</span>
                      <span className="font-mono text-sm">{formatNumber(item.value)} L</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resolved alerts count */}
            {alerts.length === 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Aucune alerte active</p>
                    <p className="text-xs text-emerald-600/70">Stocks sous contrôle</p>
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