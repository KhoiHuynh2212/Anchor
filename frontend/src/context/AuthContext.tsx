import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import api from "../services/api";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  onboarding_complete: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const res = await api.get("/auth/me");
      setUserProfile(res.data);
      return res.data;
    } catch (err: any) {
      // If the Mongo profile doesn't exist yet, sync it once then retry.
      const status = err?.response?.status;
      if (status === 404) {
        try {
          await api.post("/auth/sync");
          const res = await api.get("/auth/me");
          setUserProfile(res.data);
          return res.data;
        } catch {
          // fall through
        }
      }
      setUserProfile(null);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile();
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    await api.post("/auth/sync");
    await fetchProfile();
    // Push notifications disabled in Expo Go
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await api.post("/auth/sync");
    const profile = await fetchProfile();

    // Product rule: successful login implies onboarding is already complete.
    // (New users go through onboarding from the sign-up path.)
    if (profile && !profile.onboarding_complete) {
      try {
        await api.post("/onboarding/complete");
      } finally {
        await fetchProfile();
      }
    }
    // Push notifications disabled in Expo Go
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, userProfile, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
