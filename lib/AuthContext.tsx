import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null; // Detailed profile including role
  isLoading: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isTrainer: false,
  isStaff: false,
});

// Custom hook to access AuthContext
export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to fetch profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  useEffect(() => {
    // Check session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe(); // Cleanup on unmount
    };
  }, []);

  const isAdmin = profile?.role === "Admin";
  const isTrainer = profile?.role === "PT";
  const isStaff = profile?.role === "Staff";

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isLoading, isAdmin, isTrainer, isStaff }}
    >
      {children}
    </AuthContext.Provider>
  );
}
