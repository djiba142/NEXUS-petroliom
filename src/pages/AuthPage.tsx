import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Fuel, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, resetPasswordForEmail, updatePassword, user, hasProfile, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth view state
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Si l'utilisateur est connecté ET que la vérification du profil est terminée
    if (user && !authLoading && view !== 'reset') {
      if (hasProfile && hasRole) {
        navigate('/panel');
      }
    }
  }, [user, hasProfile, hasRole, authLoading, navigate, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Erreur de connexion',
            description: 'Email ou mot de passe incorrect',
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: 'Email non confirmé',
            description: 'Veuillez vérifier votre email pour confirmer votre compte',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
      // Note: Le succès est géré par la redirection automatique dans useEffect
      // car fetchUserData mettra à jour hasProfile/hasRole
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isUnauthorized = user && (!hasProfile || !hasRole);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
        </div>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src={logo} alt="SIHG" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">
              {view === 'login' && 'Connexion'}
              {view === 'forgot' && 'Mot de passe oublié'}
              {view === 'reset' && 'Réinitialisation'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isUnauthorized
                ? "Compte non configuré"
                : (view === 'login' ? 'Accédez à votre espace SIHG' : view === 'forgot' ? "Entrez votre email pour recevoir un lien de récupération" : 'Choisissez votre nouveau mot de passe')
              }
            </p>
          </div>

          {isUnauthorized && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <ShieldAlert className="h-5 w-5" />
                  Accès restreint
                </div>
                <p className="text-sm leading-relaxed">
                  Votre compte Google/Email est bien authentifié, mais il n'est pas encore enregistré dans la base de données officielle du SIHG.
                </p>
                <div className="text-xs space-y-1 opacity-80 border-t border-red-200 pt-2">
                  <p>• Contactez votre administrateur pour obtenir un rôle.</p>
                  <p>• Email détecté : <span className="font-mono">{user?.email}</span></p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-red-200 hover:bg-red-100 hover:text-red-900"
                  asChild
                >
                  <Link to="/">Quitter</Link>
                </Button>
              </div>
            </div>
          )}

          {!isUnauthorized && !isSuccess ? (
            <>
              {view === 'login' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Mot de passe</Label>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      'Chargement...'
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : view === 'forgot' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!email) return;
                    setLoading(true);
                    try {
                      await resetPasswordForEmail(email);
                      setIsSuccess(true);
                    } catch (err: any) {
                      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (password !== confirmPassword) {
                      toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas' });
                      return;
                    }
                    if (password.length < 6) {
                      toast({ variant: 'destructive', title: 'Erreur', description: '6 caractères minimum' });
                      return;
                    }
                    setLoading(true);
                    try {
                      await updatePassword(password);
                      setIsSuccess(true);
                    } catch (err: any) {
                      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {view === 'forgot' ? 'Email envoyé' : 'Mot de passe mis à jour'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {view === 'forgot'
                    ? "Veuillez vérifier votre boîte de réception pour continuer."
                    : "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter."}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setView('login');
                  setIsSuccess(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                Retour à la connexion
              </Button>
            </div>
          )}

          {view === 'login' && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Accès restreint
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Les inscriptions sont réservées aux administrateurs. Si vous avez besoin d'un compte, contactez les services officiels du Ministère de l'Énergie.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <Fuel className="h-24 w-24 mx-auto mb-8 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">
            Système Intelligent des Hydrocarbures de Guinée
          </h2>
          <p className="text-lg opacity-90">
            Plateforme de surveillance en temps réel pour la souveraineté énergétique nationale
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm opacity-80">Distributeurs</p>
            </div>
            <div>
              <p className="text-3xl font-bold">148</p>
              <p className="text-sm opacity-80">Stations</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm opacity-80">Monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
