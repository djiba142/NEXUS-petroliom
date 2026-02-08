import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Types de rôles disponibles dans l'application
export type AppRole = 'super_admin' | 'admin_etat' | 'inspecteur' | 'responsable_entreprise' | 'gestionnaire_station';

// Interface du profil utilisateur
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  entreprise_id?: string;
  station_id?: string;
}

// Interface pour la création d'un utilisateur (super_admin uniquement)
interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  entrepriseId?: string;
  stationId?: string;
}

// Interface du contexte d'authentification
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  canAccess: (requiredRole: AppRole) => boolean;
  createUser: (params: CreateUserParams) => Promise<{ error: Error | null; userId?: string }>;
  getDashboardRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<AppRole, number> = {
  'super_admin': 1,
  'admin_etat': 2,
  'inspecteur': 3,
  'responsable_entreprise': 4,
  'gestionnaire_station': 5,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);

      // 1. Fetch Profile (indépendant)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData as Profile);
      }

      // 2. Fetch Role (indépendant)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.warn('Error fetching role:', roleError);
        // Fallback: Check if user is in user_roles without using single() just in case
        const { data: roleFallback } = await supabase.from('user_roles').select('role').eq('user_id', userId).limit(1);
        if (roleFallback && roleFallback.length > 0) {
          setRole(roleFallback[0].role as AppRole);
        }
      } else if (roleData) {
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  /**
   * Vérifie si l'utilisateur actuel peut accéder à une fonctionnalité
   * basée sur la hiérarchie des rôles
   * @param requiredRole - Le rôle minimum requis
   * @returns true si l'utilisateur a le niveau d'accès requis ou supérieur
   */
  const canAccess = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[requiredRole];
  };

  /**
   * Retourne la route du dashboard approprié selon le rôle de l'utilisateur
   * Utilisé pour la redirection automatique après connexion
   * @returns La route du dashboard correspondant au rôle
   */
  const getDashboardRoute = (): string => {
    if (!role) return '/auth';

    // Mapping des rôles vers leurs dashboards respectifs
    const dashboardRoutes: Record<AppRole, string> = {
      'super_admin': '/dashboard/admin',
      'admin_etat': '/dashboard/sonap', // Par défaut SONAP pour admin_etat
      'inspecteur': '/', // Dashboard général pour inspecteur
      'responsable_entreprise': '/dashboard/entreprise',
      'gestionnaire_station': '/dashboard/station',
    };

    return dashboardRoutes[role];
  };

  /**
   * Crée un nouvel utilisateur sur la plateforme (réservé au super_admin)
   * Cette fonction :
   * 1. Crée l'utilisateur dans auth.users
   * 2. Assigne le rôle spécifié
   * 3. Met à jour le profil avec entreprise/station si fournis
   * 
   * @param params - Paramètres de création (email, password, fullName, role, etc.)
   * @returns Objet avec error (si erreur) et userId (si succès)
   */
  const createUser = async (params: CreateUserParams): Promise<{ error: Error | null; userId?: string }> => {
    const { email, password, fullName, role: newUserRole, entrepriseId, stationId } = params;

    // Vérification : seul le super_admin peut créer des utilisateurs
    if (role !== 'super_admin') {
      return { error: new Error('Seul le super_admin peut créer des utilisateurs') };
    }

    try {
      // Étape 1 : Créer l'utilisateur via Supabase Auth
      // Note: L'utilisateur sera auto-confirmé si la config Supabase le permet
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Utilisateur non créé');

      const newUserId = authData.user.id;

      // Étape 2 : Assigner le rôle à l'utilisateur
      // Note: Le trigger handle_new_user() crée déjà un rôle par défaut 'gestionnaire_station'
      // On doit donc UPDATE au lieu de INSERT si le rôle existe déjà
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: newUserId,
          role: newUserRole
        }, { onConflict: 'user_id, role' }); // On utilise upsert pour être plus safe

      if (roleError) {
        console.warn("Erreur lors de l'assignation du rôle:", roleError);
        // On ne throw pas forcément ici pour tenter de créer le profil quand même
      }

      // Étape 3 : Créer ou mettre à jour le profil (ESSENTIEL pour l'affichage)
      // On utilise upsert pour gérer les cas où le trigger aurait déjà créé la ligne
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: newUserId,
          email: email,
          full_name: fullName,
          entreprise_id: entrepriseId || null,
          station_id: stationId || null,
          // on ne touche pas à 'id' qui est auto-généré si nouveau
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error("Erreur création profil:", profileError);
        throw profileError;
      }

      // Succès : retourner l'ID de l'utilisateur créé
      return { error: null, userId: newUserId };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      canAccess,
      createUser,
      getDashboardRoute,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  'super_admin': 'Super Administrateur',
  'admin_etat': 'Admin État (DNH)',
  'inspecteur': 'Inspecteur',
  'responsable_entreprise': 'Responsable Entreprise',
  'gestionnaire_station': 'Gestionnaire Station',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  'super_admin': 'Accès complet à la plateforme technique et gestion des permissions',
  'admin_etat': 'Supervision nationale, validation des entités et fixation des prix officiels',
  'inspecteur': 'Consultation des données et observations de terrain',
  'responsable_entreprise': 'Gestion de la flotte de stations de son entreprise',
  'gestionnaire_station': 'Saisie quotidienne des stocks et réceptions de livraisons',
};
