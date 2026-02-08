import { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Filter,
  Plus,
  Eye,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OrdresLivraison {
  id: string;
  station_id: string;
  carburant: string;
  quantite_demandee: number;
  priorite: string;
  statut: string;
  date_demande: string;
  date_approbation: string | null;
  notes: string | null;
  stations?: {
    nom: string;
    ville: string;
    region: string;
    entreprises?: {
      sigle: string;
    };
  };
}

export default function DashboardSGP() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ordres, setOrdres] = useState<OrdresLivraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrdre, setSelectedOrdre] = useState<OrdresLivraison | null>(null);

  useEffect(() => {
    fetchOrdres();
  }, []);

  const fetchOrdres = async () => {
    try {
      const { data, error } = await supabase
        .from('ordres_livraison')
        .select(`
          *,
          stations (
            nom,
            ville,
            region,
            entreprises (
              sigle
            )
          )
        `)
        .order('date_demande', { ascending: false });

      if (error) throw error;
      setOrdres(data || []);
    } catch (error) {
      console.error('Error fetching ordres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ordreId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = { statut: newStatus };

      if (newStatus === 'approuve') {
        updateData.date_approbation = new Date().toISOString();
        updateData.approuve_par = user?.id;
      } else if (newStatus === 'en_cours') {
        updateData.date_expedition = new Date().toISOString();
      } else if (newStatus === 'livre') {
        updateData.date_livraison = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ordres_livraison')
        .update(updateData)
        .eq('id', ordreId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `L'ordre a été marqué comme "${getStatusLabel(newStatus)}"`,
      });

      fetchOrdres();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-gray-100 text-gray-700';
      case 'approuve': return 'bg-blue-100 text-blue-700';
      case 'en_cours': return 'bg-amber-100 text-amber-700';
      case 'livre': return 'bg-green-100 text-green-700';
      case 'annule': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'approuve': return 'Approuvé';
      case 'en_cours': return 'En cours';
      case 'livre': return 'Livré';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'bg-red-500 text-white';
      case 'haute': return 'bg-orange-500 text-white';
      case 'normale': return 'bg-blue-500 text-white';
      case 'basse': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const stats = {
    enAttente: ordres.filter(o => o.statut === 'en_attente').length,
    enCours: ordres.filter(o => o.statut === 'en_cours').length,
    livres: ordres.filter(o => o.statut === 'livre').length,
    urgents: ordres.filter(o => o.priorite === 'urgente' && o.statut !== 'livre').length,
  };

  return (
    <DashboardLayout
      title="Dashboard SGP"
      subtitle="Gestion des ordres de livraison et logistique"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="En attente"
          value={stats.enAttente}
          subtitle="ordres à traiter"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="En cours"
          value={stats.enCours}
          subtitle="camions en route"
          icon={Truck}
          variant="default"
        />
        <StatCard
          title="Livrés (mois)"
          value={stats.livres}
          subtitle="ordres complétés"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Urgents"
          value={stats.urgents}
          subtitle="priorité haute"
          icon={AlertTriangle}
          variant="critical"
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Ordres de Livraison
              </CardTitle>
              <CardDescription>
                Gestion des expéditions vers les stations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tous" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tous">Tous ({ordres.length})</TabsTrigger>
              <TabsTrigger value="en_attente">En attente ({stats.enAttente})</TabsTrigger>
              <TabsTrigger value="en_cours">En cours ({stats.enCours})</TabsTrigger>
              <TabsTrigger value="livre">Livrés ({stats.livres})</TabsTrigger>
              <TabsTrigger value="prix">Prix Officiels</TabsTrigger>
            </TabsList>

            <TabsContent value="prix">
              <PrixOfficielsManager />
            </TabsContent>

            <TabsContent value="tous">
              <OrdersTable
                ordres={ordres}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getPrioriteColor={getPrioriteColor}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setSelectedOrdre}
              />
            </TabsContent>
            <TabsContent value="en_attente">
              <OrdersTable
                ordres={ordres.filter(o => o.statut === 'en_attente')}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getPrioriteColor={getPrioriteColor}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setSelectedOrdre}
              />
            </TabsContent>
            <TabsContent value="en_cours">
              <OrdersTable
                ordres={ordres.filter(o => o.statut === 'en_cours')}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getPrioriteColor={getPrioriteColor}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setSelectedOrdre}
              />
            </TabsContent>
            <TabsContent value="livre">
              <OrdersTable
                ordres={ordres.filter(o => o.statut === 'livre')}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getPrioriteColor={getPrioriteColor}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={setSelectedOrdre}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrdre} onOpenChange={() => setSelectedOrdre(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'Ordre</DialogTitle>
            <DialogDescription>
              Informations complètes sur la livraison
            </DialogDescription>
          </DialogHeader>
          {selectedOrdre && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Station</p>
                  <p className="font-medium">{selectedOrdre.stations?.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{selectedOrdre.stations?.entreprises?.sigle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Localisation</p>
                  <p className="font-medium">{selectedOrdre.stations?.ville}, {selectedOrdre.stations?.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carburant</p>
                  <p className="font-medium capitalize">{selectedOrdre.carburant}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantité</p>
                  <p className="font-medium">{selectedOrdre.quantite_demandee.toLocaleString()} L</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priorité</p>
                  <Badge className={getPrioriteColor(selectedOrdre.priorite)}>
                    {selectedOrdre.priorite}
                  </Badge>
                </div>
              </div>
              {selectedOrdre.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedOrdre.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {selectedOrdre.statut === 'en_attente' && (
                  <Button onClick={() => {
                    handleUpdateStatus(selectedOrdre.id, 'approuve');
                    setSelectedOrdre(null);
                  }}>
                    Approuver
                  </Button>
                )}
                {selectedOrdre.statut === 'approuve' && (
                  <Button onClick={() => {
                    handleUpdateStatus(selectedOrdre.id, 'en_cours');
                    setSelectedOrdre(null);
                  }}>
                    Marquer en cours
                  </Button>
                )}
                {selectedOrdre.statut === 'en_cours' && (
                  <Button onClick={() => {
                    handleUpdateStatus(selectedOrdre.id, 'livre');
                    setSelectedOrdre(null);
                  }}>
                    Confirmer livraison
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface OrdersTableProps {
  ordres: OrdresLivraison[];
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getPrioriteColor: (priorite: string) => string;
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetails: (ordre: OrdresLivraison) => void;
}

function OrdersTable({
  ordres,
  getStatusColor,
  getStatusLabel,
  getPrioriteColor,
  onUpdateStatus,
  onViewDetails
}: OrdersTableProps) {
  if (ordres.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun ordre dans cette catégorie
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Station</TableHead>
          <TableHead>Carburant</TableHead>
          <TableHead>Quantité</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordres.map((ordre) => (
          <TableRow key={ordre.id}>
            <TableCell>
              <div>
                <p className="font-medium">{ordre.stations?.nom}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ordre.stations?.ville}
                </p>
              </div>
            </TableCell>
            <TableCell className="capitalize">{ordre.carburant}</TableCell>
            <TableCell>{ordre.quantite_demandee.toLocaleString()} L</TableCell>
            <TableCell>
              <Badge className={getPrioriteColor(ordre.priorite)}>
                {ordre.priorite}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(ordre.statut)}>
                {getStatusLabel(ordre.statut)}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(ordre.date_demande).toLocaleDateString('fr-FR')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(ordre)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {ordre.statut === 'en_attente' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(ordre.id, 'approuve')}
                  >
                    Approuver
                  </Button>
                )}
                {ordre.statut === 'approuve' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(ordre.id, 'en_cours')}
                  >
                    Expédier
                  </Button>
                )}
                {ordre.statut === 'en_cours' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onUpdateStatus(ordre.id, 'livre')}
                  >
                    Livré
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Composant de gestion des prix officiels des hydrocarbures
 * Permet de visualiser et modifier les prix (si admin_etat)
 */
function PrixOfficielsManager() {
  const [prix, setPrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPrix();
  }, []);

  const fetchPrix = async () => {
    try {
      const { data, error } = await supabase
        .from('prix_officiels')
        .select('*')
        .order('date_effet', { ascending: false });

      if (error) throw error;
      if (data) setPrix(data);
    } catch (error) {
      console.error('Erreur chargement prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prix officiels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrix = async (id: string, newPrix: number) => {
    try {
      const { error } = await supabase
        .from('prix_officiels')
        .update({
          prix_litre: newPrix,
          modifie_par: user?.id,
          date_effet: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Prix mis à jour",
        description: "Le nouveau prix officiel a été enregistré."
      });
      fetchPrix();
    } catch (error) {
      console.error('Erreur maj prix:', error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du prix",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (prix.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun prix officiel configuré.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prix.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                {p.carburant}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{p.prix_litre.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">GNF/L</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const input = prompt(`Nouveau prix pour ${p.carburant} (actuel: ${p.prix_litre} GNF)`);
                    if (input) {
                      const newPrice = parseFloat(input);
                      if (!isNaN(newPrice) && newPrice > 0) {
                        handleUpdatePrix(p.id, newPrice);
                      } else {
                        toast({
                          title: "Valeur invalide",
                          description: "Veuillez entrer un montant valide.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dernière modif: {new Date(p.date_effet).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
