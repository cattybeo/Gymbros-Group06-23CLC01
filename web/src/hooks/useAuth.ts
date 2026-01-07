import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, AppRole } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    loading: true,
    isAdmin: false,
    isStaff: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
        }));

        if (session?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            const role = profile?.role;

            if (role !== 'Admin' && role !== 'Staff') {
              console.warn('Unauthorized access attempt. User role:', role);
              await supabase.auth.signOut();
              return;
            }

            setAuthState(prev => ({
              ...prev,
              profile,
              role,
              isAdmin: role === 'Admin',
              isStaff: role === 'Staff',
            }));
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            role: null,
            isAdmin: false,
            isStaff: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
      }));

      if (session?.user) {
        fetchProfile(session.user.id).then(async profile => {
          const role = profile?.role;

          // Only allow Admin and Staff roles to access admin console
          if (role !== 'Admin' && role !== 'Staff') {
            console.warn('Unauthorized access attempt. User role:', role);
            await supabase.auth.signOut();
            return;
          }

          setAuthState(prev => ({
            ...prev,
            profile,
            role,
            isAdmin: role === 'Admin',
            isStaff: role === 'Staff',
          }));
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error };
    }

    // Check role after successful authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await fetchProfile(user.id);
      const role = profile?.role;

      if (role !== 'Admin' && role !== 'Staff') {
        await supabase.auth.signOut();
        return { error: { message: 'Unauthorized: Only Admin and Staff can access this console' } };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
}
