import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EntrepriseCard } from '@/components/entreprises/EntrepriseCard';
import { regions } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
// Import logos
import logoTotal from '@/assets/logos/total-energies.png';
import logoShell from '@/assets/logos/shell.jpg';
import logoTMI from '@/assets/logos/tmi.jpg';
import logoKP from '@/assets/logos/kamsar-petroleum.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Entreprise } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function EntreprisesPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    nom: string;
    sigle: string;
    type: 'compagnie' | 'distributeur' | '';
    numeroAgrement: string;
    region: string;
    contactNom: string;
    contactTelephone: string;
    contactEmail: string;
  }>({
    nom: '',
    sigle: '',
    type: '',
    numeroAgrement: '',
    region: '',
    contactNom: '',
    contactTelephone: '',
    contactEmail: '',
  });

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
  };

  const { toast } = useToast();

  const fetchEntreprises = async () => {
    setLoading(true);
    try {
      const { data: entData, error } = await supabase.from('entreprises').select('*').order('nom');
      if (error) throw error;

      const { data: stationCounts } = await supabase.from('stations').select('entreprise_id');
      const counts = (stationCounts || []).reduce<Record<string, number>>((acc, s) => {
        const id = s.entreprise_id;
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      const mapped: Entreprise[] = (entData || []).map(e => ({
        id: e.id,
        nom: e.nom,
        sigle: e.sigle,
        type: e.type as 'compagnie' | 'distributeur',
        numeroAgrement: e.numero_agrement,
        region: e.region,
        statut: e.statut as 'actif' | 'suspendu' | 'ferme',
        nombreStations: counts[e.id] ?? 0,
        logo: e.logo_url || localLogoMapping[e.sigle] || undefined,
        contact: {
          nom: e.contact_nom || 'N/A',
          telephone: e.contact_telephone || '',
          email: e.contact_email || '',
        },
      }));
      setEntreprises(mapped);
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur de chargement',
        description: err instanceof Error ? err.message : 'Impossible de charger les entreprises.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntreprises();
  }, []);

  const filteredEntreprises = entreprises.filter(e => {
    const matchesSearch = e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sigle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || e.region === selectedRegion;
    const matchesType = selectedType === 'all' || e.type === selectedType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const handleSaveEntreprise = async () => {
    if (!formData.nom || !formData.sigle || !formData.type || !formData.region) {
      toast({
        variant: 'destructive',
        title: 'Champs obligatoires manquants',
        description: 'Veuillez renseigner au minimum le nom, le sigle, le type et la région de l’entreprise.',
      });
      return;
    }

    const numeroAgrement = formData.numeroAgrement.trim() || `AGR-${Date.now()}`;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('entreprises')
        .insert({
          nom: formData.nom.trim(),
          sigle: formData.sigle.trim(),
          type: formData.type,
          region: formData.region,
          numero_agrement: numeroAgrement,
          statut: 'actif',
          contact_nom: formData.contactNom.trim() || null,
          contact_telephone: formData.contactTelephone.trim() || null,
          contact_email: formData.contactEmail.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Entreprise enregistrée',
        description: `${formData.nom} a été créée avec succès.`,
      });
      setFormData({
        nom: '',
        sigle: '',
        type: '',
        numeroAgrement: '',
        region: '',
        contactNom: '',
        contactTelephone: '',
        contactEmail: '',
      });
      setIsDialogOpen(false);
      fetchEntreprises();
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: "Erreur lors de l'enregistrement",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer l'entreprise.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Entreprises"
      subtitle="Gestion des distributeurs d'hydrocarbures"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les régions</SelectItem>
            {regions.map(region => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="compagnie">Compagnie</SelectItem>
            <SelectItem value="distributeur">Distributeur</SelectItem>
          </SelectContent>
        </Select>

        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-secondary/50 rounded-xl">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{filteredEntreprises.length}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Actives</p>
          <p className="text-2xl font-bold text-stock-healthy">
            {filteredEntreprises.filter(e => e.statut === 'actif').length}
          </p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">Stations totales</p>
          <p className="text-2xl font-bold">
            {filteredEntreprises.reduce((sum, e) => sum + e.nombreStations, 0)}
          </p>
        </div>
      </div>

      {/* Entreprises Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin mb-4 opacity-20" />
          <p>Chargement des entreprises...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEntreprises.map(entreprise => (
            <EntrepriseCard key={entreprise.id} entreprise={entreprise} />
          ))}
        </div>
      )}

      {!loading && filteredEntreprises.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Aucune entreprise trouvée</p>
          <p className="text-sm">Modifiez vos critères de recherche</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise</DialogTitle>
            <DialogDescription>
              Renseignez les informations principales de l&apos;entreprise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l&apos;entreprise *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: TotalEnergies Guinée"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sigle">Sigle *</Label>
              <Input
                id="sigle"
                value={formData.sigle}
                onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                placeholder="Ex: TOTAL"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'compagnie' | 'distributeur') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compagnie">Compagnie</SelectItem>
                    <SelectItem value="distributeur">Distributeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Région *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agrement">N° d&apos;agrément</Label>
              <Input
                id="agrement"
                value={formData.numeroAgrement}
                onChange={(e) => setFormData({ ...formData, numeroAgrement: e.target.value })}
                placeholder="Ex: AGR-2026-001"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNom">Contact principal</Label>
                <Input
                  id="contactNom"
                  value={formData.contactNom}
                  onChange={(e) => setFormData({ ...formData, contactNom: e.target.value })}
                  placeholder="Nom et prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactTelephone">Téléphone</Label>
                <Input
                  id="contactTelephone"
                  value={formData.contactTelephone}
                  onChange={(e) => setFormData({ ...formData, contactTelephone: e.target.value })}
                  placeholder="+224 6XX XX XX XX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@entreprise.gn"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEntreprise} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
