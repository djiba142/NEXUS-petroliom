import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Truck, FileText, Eye, Building2, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Order {
    id: string;
    created_at: string;
    carburant: string;
    quantite_demandee: number;
    priorite: string;
    statut: string;
    notes: string | null;
    entreprise: { nom: string; sigle: string } | null;
    station: { nom: string; ville: string } | null;
}

const statusColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    approuve: 'bg-blue-100 text-blue-800',
    en_cours: 'bg-purple-100 text-purple-800',
    livre: 'bg-green-100 text-green-800',
    annule: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchOrders();

        // Realtime subscription
        const channel = supabase
            .channel('public:ordres_livraison')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ordres_livraison' },
                (payload) => {
                    console.log('Change received!', payload);
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('ordres_livraison')
                .select(`
          *,
          entreprise:entreprises(nom, sigle),
          station:stations(nom, ville)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('ordres_livraison')
                .update({ statut: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Statut mis à jour",
                description: `La commande est maintenant ${newStatus}`,
            });
            fetchOrders();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: error.message,
            });
        }
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.statut === filterStatus);

    if (loading) {
        return (
            <DashboardLayout title="Gestion des Commandes" subtitle="SONAP">
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Gestion des Commandes" subtitle="SONAP">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Liste des Commandes ({filteredOrders.length})</CardTitle>
                    <div className="w-[200px]">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tout voir</SelectItem>
                                <SelectItem value="en_attente">En attente</SelectItem>
                                <SelectItem value="approuve">Approuvé</SelectItem>
                                <SelectItem value="en_cours">En cours</SelectItem>
                                <SelectItem value="livre">Livré</SelectItem>
                                <SelectItem value="annule">Annulé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Entreprise / Station</TableHead>
                                <TableHead>Carburant</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Priorité</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Aucune commande trouvée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{order.entreprise?.sigle || 'N/A'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {order.station ? order.station.nom : '🏢 Stock Central'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{order.carburant}</TableCell>
                                        <TableCell>{order.quantite_demandee.toLocaleString()} L</TableCell>
                                        <TableCell>
                                            {order.priorite === 'urgente' && <Badge variant="destructive">Urgente</Badge>}
                                            {order.priorite === 'haute' && <Badge variant="secondary" className="bg-orange-100 text-orange-800">Haute</Badge>}
                                            {order.priorite === 'normale' && <Badge variant="outline">Normale</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.statut] || 'bg-gray-100'}`}>
                                                {order.statut.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {order.statut === 'en_attente' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                                            onClick={() => updateStatus(order.id, 'approuve')}
                                                            title="Approuver"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => updateStatus(order.id, 'annule')}
                                                            title="Refuser"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {order.statut === 'approuve' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 gap-2"
                                                        onClick={() => updateStatus(order.id, 'en_cours')}
                                                    >
                                                        <Truck className="h-3 w-3" /> Expédier
                                                    </Button>
                                                )}
                                                {(order.statut === 'en_cours' || order.statut === 'livre' || order.statut === 'annule') && (
                                                    <Button variant="ghost" size="sm" disabled>
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Détails de la Commande</DialogTitle>
                        <DialogDescription>
                            Référence: #{selectedOrder?.id.slice(0, 8)}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Entreprise</Label>
                                    <div className="flex items-center gap-2 font-medium">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        {selectedOrder.entreprise?.nom || 'N/A'} ({selectedOrder.entreprise?.sigle})
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Destination</Label>
                                    <div className="flex items-center gap-2 font-medium">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {selectedOrder.station ? selectedOrder.station.nom : '🏢 Stock Central / Dépôt'}
                                        {selectedOrder.station && <span className="text-xs text-muted-foreground">({selectedOrder.station.ville})</span>}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Produit</Label>
                                    <div className="font-semibold text-lg capitalize">{selectedOrder.carburant}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Quantité Demandée</Label>
                                    <div className="font-semibold text-lg">{selectedOrder.quantite_demandee.toLocaleString()} L</div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Date de commande</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Priorité</Label>
                                    <div>
                                        {selectedOrder.priorite === 'urgente' && <Badge variant="destructive">Urgente</Badge>}
                                        {selectedOrder.priorite === 'haute' && <Badge variant="secondary" className="bg-orange-100 text-orange-800">Haute</Badge>}
                                        {selectedOrder.priorite === 'normale' && <Badge variant="outline">Normale</Badge>}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs">Statut Actuel</Label>
                                    <div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.statut] || 'bg-gray-100'}`}>
                                            {selectedOrder.statut.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2 bg-muted/50 p-3 rounded-md">
                                        <Label className="text-muted-foreground text-xs">Notes / Instructions</Label>
                                        <p className="text-sm italic">"{selectedOrder.notes}"</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter className="sm:justify-between">
                        <div className="flex-1">
                            {selectedOrder?.statut === 'en_attente' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => {
                                            if (selectedOrder) updateStatus(selectedOrder.id, 'approuve');
                                            setIsDetailsOpen(false);
                                        }}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approuver
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (selectedOrder) updateStatus(selectedOrder.id, 'annule');
                                            setIsDetailsOpen(false);
                                        }}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Refuser
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
