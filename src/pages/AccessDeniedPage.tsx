import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, ROLE_LABELS } from '@/contexts/AuthContext';

export default function AccessDeniedPage() {
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-stock-critical" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Accès Refusé</h1>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          {role ? (
            <span className="block mt-2">
              Votre rôle actuel : <strong>{ROLE_LABELS[role]}</strong>
            </span>
          ) : (
            <span className="block mt-2 text-amber-600 font-medium">
              Votre compte n'a pas encore de rôle assigné. Veuillez contacter un administrateur.
            </span>
          )}
        </p>
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
