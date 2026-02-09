import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const { role, loading, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [loading, navigate, getDashboardRoute]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4 opacity-50" />
      <h2 className="text-xl font-semibold mb-2 text-foreground">Préparation de votre espace de travail</h2>
      <p className="text-muted-foreground">Chargement de votre tableau de bord personnalisé...</p>
    </div>
  );
};

export default Index;
