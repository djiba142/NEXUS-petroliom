import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS, AppRole, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().min(2, 'Nom complet requis'),
  role: z.enum(['super_admin', 'admin_etat', 'inspecteur', 'responsable_entreprise', 'gestionnaire_station']),
  phone: z.string().optional(),
  entrepriseId: z.string().optional(),
  stationId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const { createUser, role: currentUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [entreprises, setEntreprises] = useState<{ id: string, nom: string }[]>([]);
  const [stations, setStations] = useState<{ id: string, nom: string, entreprise_id: string }[]>([]);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'gestionnaire_station',
      phone: '',
      entrepriseId: '',
      stationId: '',
    },
  });

  const selectedRole = form.watch('role');
  const selectedEntreprise = form.watch('entrepriseId');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    // Si l'utilisateur est un responsable d'entreprise, on fixe son entreprise_id
    if (currentUserRole === 'responsable_entreprise' && currentUserProfile?.entreprise_id) {
      form.setValue('entrepriseId', currentUserProfile.entreprise_id);
      form.setValue('role', 'gestionnaire_station');
    }
  }, [currentUserRole, currentUserProfile, open]);

  const fetchData = async () => {
    try {
      const { data: entData } = await supabase.from('entreprises').select('id, nom');
      setEntreprises(entData || []);

      const { data: stData } = await supabase.from('stations').select('id, nom, entreprise_id');
      setStations(stData || []);
    } catch (error) {
      console.error('Error fetching data for dialog:', error);
    }
  };

  const filteredStations = selectedEntreprise
    ? stations.filter(s => s.entreprise_id === selectedEntreprise)
    : [];

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);

    try {
      const { error } = await createUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
        entrepriseId: data.entrepriseId || undefined,
        stationId: data.stationId || undefined,
      });

      if (error) throw error;

      toast({
        title: "Utilisateur créé",
        description: `Le compte de ${data.fullName} (${data.email}) a été créé avec succès.`,
      });

      form.reset();
      onOpenChange(false);
      onUserCreated?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage des rôles créables
  const getAllowedRoles = (): AppRole[] => {
    if (currentUserRole === 'super_admin') return ['super_admin', 'admin_etat', 'inspecteur', 'responsable_entreprise', 'gestionnaire_station'];
    if (currentUserRole === 'admin_etat') return ['inspecteur', 'responsable_entreprise', 'gestionnaire_station'];
    if (currentUserRole === 'responsable_entreprise') return ['gestionnaire_station'];
    return [];
  };

  const allowedRoles = getAllowedRoles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Créer un utilisateur
          </DialogTitle>
          <DialogDescription>
            Créer un nouveau compte utilisateur avec un rôle spécifique.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                placeholder="Mamadou Diallo"
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="utilisateur@exemple.gn"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="+224 6XX XX XX XX"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                placeholder="Minimum 8 caractères"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(value: AppRole) => form.setValue('role', value)}
                disabled={currentUserRole === 'responsable_entreprise'} // Fixé pour les responsables
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedRole === 'responsable_entreprise' || selectedRole === 'gestionnaire_station') && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="entrepriseId">Entreprise</Label>
                <Select
                  value={form.watch('entrepriseId')}
                  onValueChange={(value) => {
                    form.setValue('entrepriseId', value);
                    form.setValue('stationId', '');
                  }}
                  disabled={currentUserRole === 'responsable_entreprise'} // Fixé pour les responsables
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {entreprises.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === 'gestionnaire_station' && selectedEntreprise && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="stationId">Station</Label>
                <Select
                  value={form.watch('stationId')}
                  onValueChange={(value) => form.setValue('stationId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une station" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStations.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
