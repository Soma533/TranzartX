"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthState = { signedIn: boolean; loading: boolean };
const AuthContext = createContext<AuthState>({ signedIn: false, loading: true });

/**
 * Single source of truth for "is someone signed in", so the menu, bottom tab
 * bar and laptop rail all agree. Product navigation is hidden from visitors.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ signedIn: false, loading: true });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setState({ signedIn: Boolean(data.session), loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ signedIn: Boolean(session), loading: false });
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthContext);
}