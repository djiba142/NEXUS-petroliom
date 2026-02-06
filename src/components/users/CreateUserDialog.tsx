import { useState } from 'react';
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
import { ROLE_LABELS, AppRole } from '@/contexts/AuthContext';
import { mockEntreprises, mockStations } from '@/data/mockData';
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
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

  const filteredStations = selectedEntreprise 
    ? mockStations.filter(s => s.entrepriseId === selectedEntreprise)
    : [];

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);
    
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Call the create-user edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            role: data.role,
            phone: data.phone || undefined,
            entreprise_id: data.entrepriseId || undefined,
            station_id: data.stationId || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map(role => (
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEntreprises.map(e => (
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
