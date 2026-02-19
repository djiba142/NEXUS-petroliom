import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Types de rôles disponibles dans l'application
export type AppRole = 'super_admin' | 'responsable_entreprise';

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
  updateUser: (userId: string, params: Partial<CreateUserParams>) => Promise<{ error: Error | null }>;
  deleteUser: (userId: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  getDashboardRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<AppRole, number> = {
  'super_admin': 1,
  'responsable_entreprise': 2,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);

      // Execute queries in parallel for better performance
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      // Handle Profile Result
      if (profileResult.error) {
        console.warn('Error fetching profile:', profileResult.error);
      } else if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      }

      // Handle Role Result
      if (roleResult.error) {
        console.warn('Error fetching role:', roleResult.error);
        const { data: roleFallback } = await supabase.from('user_roles').select('role').eq('user_id', userId).limit(1);
        if (roleFallback && roleFallback.length > 0) {
          setRole(roleFallback[0].role as AppRole);
        } else {
          setRole(null);
        }
      } else if (roleResult.data) {
        setRole(roleResult.data.role as AppRole);
      } else {
        setRole(null);
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

  const canAccess = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[requiredRole];
  };

  const getDashboardRoute = (): string => {
    if (!role) return '/auth';
    if (role === 'super_admin') return '/dashboard/admin';
    return '/dashboard/entreprise';
  };

  const createUser = async (params: CreateUserParams): Promise<{ error: Error | null; userId?: string }> => {
    const { email, password, fullName, role: newUserRole, entrepriseId, stationId } = params;
    if (role !== 'super_admin') return { error: new Error('Permissions insuffisantes') };

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Utilisateur non créé');

      const newUserId = authData.user.id;
      await supabase.from('user_roles').insert({ user_id: newUserId, role: newUserRole });
      await supabase.from('profiles').upsert({
        user_id: newUserId,
        email: email,
        full_name: fullName,
        entreprise_id: entrepriseId || null,
        station_id: stationId || null,
      }, { onConflict: 'user_id' });

      return { error: null, userId: newUserId };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateUser = async (userId: string, params: Partial<CreateUserParams>): Promise<{ error: Error | null }> => {
    if (role !== 'super_admin') return { error: new Error('Permissions insuffisantes') };
    return { error: null };
  };

  const deleteUser = async (userId: string): Promise<{ error: Error | null }> => {
    if (role !== 'super_admin') return { error: new Error('Permissions insuffisantes') };
    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
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
      updateUser,
      deleteUser,
      resetPasswordForEmail,
      updatePassword,
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
  'super_admin': 'Super Administrateur (SONAP)',
  'responsable_entreprise': 'Responsable Entreprise',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  'super_admin': 'Accès complet à la plateforme nationale et gestion du système',
  'responsable_entreprise': 'Gestion des stations et des stocks de son entreprise',
};
