import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  profileLoading: boolean;
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
  const [profileLoading, setProfileLoading] = useState(false);
  const signingInRef = useRef(false);

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const res = await api.get("/auth/me");
      setUserProfile(res.data);
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // If the Mongo profile doesn't exist yet, sync it once then retry.
        try {
          await api.post("/auth/sync");
          const res = await api.get("/auth/me");
          setUserProfile(res.data);
          return res.data;
        } catch {
          // Genuine 404 after sync — new user with no profile
          setUserProfile(null);
          return null;
        }
      }
      // On transient errors (network, 500, etc.), keep existing profile state
      // instead of wiping it to null (which would flash onboarding)
      return userProfile;
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
        // Skip fetchProfile if signIn/signUp is actively handling it
        if (!signingInRef.current) {
          fetchProfile();
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    signingInRef.current = true;
    setProfileLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      await api.post("/auth/sync");
      await fetchProfile();
    } finally {
      signingInRef.current = false;
      setProfileLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    signingInRef.current = true;
    setProfileLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await api.post("/auth/sync");
      await fetchProfile();
    } finally {
      signingInRef.current = false;
      setProfileLoading(false);
    }
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
      value={{ session, user, userProfile, loading, profileLoading, signUp, signIn, signOut, refreshProfile }}
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
