import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
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

    // Mapping consolidé vers trois dashboards principaux
    const dashboardRoutes: Record<AppRole, string> = {
      'super_admin': '/dashboard/admin',
      'admin_etat': '/dashboard/admin', // SONAP utilise le dashboard admin
      'inspecteur': '/dashboard/admin',  // Inspecteur utilise la vue nationale
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

    // Vérification des permissions de création
    const isSuperAdmin = role === 'super_admin';
    const isCompanyAdmin = role === 'responsable_entreprise';

    if (!isSuperAdmin && !isCompanyAdmin) {
      return { error: new Error('Permissions insuffisantes pour créer un utilisateur') };
    }

    // Un responsable d'entreprise ne peut créer que des gestionnaires de station
    if (isCompanyAdmin && newUserRole !== 'gestionnaire_station') {
      return { error: new Error('Un responsable d\'entreprise ne peut créer que des gestionnaires de station') };
    }

    // Un responsable d'entreprise ne peut créer des utilisateurs que pour SA propre entreprise
    if (isCompanyAdmin && entrepriseId !== profile?.entreprise_id) {
      return { error: new Error('Vous ne pouvez créer des utilisateurs que pour votre propre entreprise') };
    }

    try {
      // Étape 1 : Créer l'utilisateur via Supabase Auth
      // Utilisation d'un client temporaire pour éviter de déconnecter l'admin actuel
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: signUpError } = await tempClient.auth.signUp({
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
      // Le trigger handle_new_user() crée déjà un rôle par défaut 'gestionnaire_station'.
      // Pour éviter les doublons, on MET À JOUR cette ligne au lieu d'en insérer une nouvelle.

      // D'abord on essaie de mettre à jour le rôle existant
      const { data: updateData, error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newUserRole })
        .eq('user_id', newUserId)
        .select();

      // Si aucune ligne n'a été mise à jour (le trigger a failli pour une raison quelconque),
      // alors on insère le rôle.
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUserId,
            role: newUserRole
          });

        if (insertError) {
          console.error("Erreur lors de l'insertion du rôle:", insertError);
        }
      } else if (updateError) {
        console.error("Erreur lors de la mise à jour du rôle:", updateError);
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
