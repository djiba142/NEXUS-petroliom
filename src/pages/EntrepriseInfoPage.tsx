import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logUpdateResource } from '@/lib/auditLog';

interface EntrepriseInfo {
  id: string;
  nom: string;
  sigle: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  representant_nom?: string;
  representant_telephone?: string;
  representant_email?: string;
  created_at?: string;
  updated_at?: string;
}

export default function EntrepriseInfoPage() {
  const { profile, role } = useAuth();
  const { toast } = useToast();
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EntrepriseInfo>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (role === 'responsable_entreprise' && profile?.entreprise_id) {
      fetchEntrepriseInfo();
    } else if (role === 'super_admin') {
      // Super admin can view/edit any enterprise
      // For now, load first enterprise or get from URL param
      fetchEntrepriseInfo();
    }
  }, [profile?.entreprise_id, role]);

  const fetchEntrepriseInfo = async () => {
    setLoading(true);
    try {
      let query = supabase.from('entreprises').select('*');

      if (role === 'responsable_entreprise' && profile?.entreprise_id) {
        query = query.eq('id', profile.entreprise_id);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      setEntreprise(data);
      setFormData(data);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les informations de l\'entreprise',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EntrepriseInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!entreprise?.id) return;

    setSaving(true);
    try {
      // Detect changes
      const changes: Record<string, any> = {};
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof EntrepriseInfo] !== entreprise[key as keyof EntrepriseInfo]) {
          changes[key] = {
            old: entreprise[key as keyof EntrepriseInfo],
            new: formData[key as keyof EntrepriseInfo]
          };
        }
      });

      // Update in database
      const { error } = await supabase
        .from('entreprises')
        .update(formData)
        .eq('id', entreprise.id);

      if (error) throw error;

      // Log the update
      await logUpdateResource(
        'entreprises',
        formData.nom || entreprise.nom,
        changes,
        entreprise.id
      );

      toast({
        title: 'Succès',
        description: 'Les informations de l\'entreprise ont été mises à jour',
      });

      setEntreprise({ ...entreprise, ...formData } as EntrepriseInfo);
      setHasChanges(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour les informations',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(entreprise || {});
    setHasChanges(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Mon Entreprise" subtitle="Gestion des informations">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!entreprise) {
    return (
      <DashboardLayout title="Mon Entreprise" subtitle="Gestion des informations">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune entreprise associée à votre compte.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (role === 'responsable_entreprise') {
    return (
      <DashboardLayout
        title="Mon Entreprise"
        subtitle="Modifier les informations de votre entreprise"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{entreprise.nom}</span>
              <Badge variant="secondary">{entreprise.sigle}</Badge>
            </CardTitle>
            <CardDescription>
              Toutes vos modifications seront enregistrées dans le système d'audit
            </CardDescription>
          </CardHeader>

          {hasChanges && (
            <CardContent>
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Vous avez des modifications non sauvegardées. Cliquez sur Enregistrer pour les valider.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          <CardContent className="space-y-6">
            {/* Informations Générales */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l'Entreprise</Label>
                  <Input
                    id="nom"
                    value={formData.nom || ''}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sigle">Sigle</Label>
                  <Input
                    id="sigle"
                    value={formData.sigle || ''}
                    onChange={(e) => handleInputChange('sigle', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone || ''}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Adresse</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={formData.adresse || ''}
                    onChange={(e) => handleInputChange('adresse', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={formData.ville || ''}
                      onChange={(e) => handleInputChange('ville', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Input
                      id="region"
                      value={formData.region || ''}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Représentant */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Représentant</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representant_nom">Nom</Label>
                  <Input
                    id="representant_nom"
                    value={formData.representant_nom || ''}
                    onChange={(e) => handleInputChange('representant_nom', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representant_telephone">Téléphone</Label>
                  <Input
                    id="representant_telephone"
                    value={formData.representant_telephone || ''}
                    onChange={(e) => handleInputChange('representant_telephone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representant_email">Email</Label>
                  <Input
                    id="representant_email"
                    type="email"
                    value={formData.representant_email || ''}
                    onChange={(e) => handleInputChange('representant_email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button onClick={handleSave} disabled={!hasChanges || saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>

              {hasChanges && (
                <Button onClick={handleCancel} variant="outline">
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Super admin view - can be extended
  return (
    <DashboardLayout
      title="Gestion Entreprise"
      subtitle="Consulter les informations de l'entreprise"
    >
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Fonctionnalité réservée aux responsables d'entreprise.</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
