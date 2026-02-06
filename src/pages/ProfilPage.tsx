import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  Camera,
  Save,
  Shield
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ProfilPage() {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  const handleSave = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout 
      title="Mon Profil" 
      subtitle="Gérer vos informations personnelles"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile?.full_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="text-xl font-bold font-display">
                {profile?.full_name || 'Utilisateur'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {profile?.email || user?.email}
              </p>
              
              {role && (
                <Badge variant="secondary" className="mb-4">
                  {ROLE_LABELS[role]}
                </Badge>
              )}
              
              <Separator className="my-4 w-full" />
              
              <div className="w-full text-left space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {profile?.email || user?.email}
                  </span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.phone}</span>
                  </div>
                )}
                {profile?.entreprise_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Entreprise assignée</span>
                  </div>
                )}
                {profile?.station_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Station assignée</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
            </CardTitle>
            <CardDescription>
              Modifier vos informations de compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+224 6XX XX XX XX"
                />
              </div>
            </div>

            <Separator />

            {/* Role Info */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Rôle et Permissions</h4>
              </div>
              {role && (
                <>
                  <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Le rôle est attribué par un administrateur et ne peut pas être modifié.
              </p>
            </div>

            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
