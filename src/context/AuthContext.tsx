import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoOrganisation, demoProfiles, DEMO_USER_ID } from "../data/mockData";
import { supabase } from "../lib/supabase/client";
import { createOnboardingWorkspace, fetchAuthWorkspace } from "../lib/supabase/repository";
import type { Organisation, Profile } from "../types";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  organisation: Organisation | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, organisationName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function demoUser(email = "demo@xdealer.local"): AuthUser {
  return { id: DEMO_USER_ID, email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(demoUser());
  const [profile, setProfile] = useState<Profile | null>(demoProfiles[0]);
  const [organisation, setOrganisation] = useState<Organisation | null>(demoOrganisation);
  const [loading, setLoading] = useState(Boolean(supabase));
  const demoMode = !supabase;

  const loadWorkspaceForUser = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser || !supabase) {
      setUser(authUser);
      setProfile(null);
      setOrganisation(null);
      return;
    }
    const workspace = await fetchAuthWorkspace(authUser.id);
    setUser(workspace ? authUser : null);
    setProfile(workspace?.profile ?? null);
    setOrganisation(workspace?.organisation ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      try {
        await loadWorkspaceForUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? "" } : null);
      } finally {
        if (mounted) setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      void loadWorkspaceForUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? "" } : null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadWorkspaceForUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setUser(demoUser(email));
      setProfile({ ...demoProfiles[0], email });
      setOrganisation(demoOrganisation);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const authUser = { id: data.user.id, email: data.user.email ?? email };
      const workspace = await fetchAuthWorkspace(authUser.id);
      if (!workspace) {
        throw new Error("No xDealer workspace is linked to this Supabase user.");
      }
      setUser(authUser);
      setProfile(workspace.profile);
      setOrganisation(workspace.organisation);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, organisationName?: string) => {
    if (!supabase) {
      setUser(demoUser(email));
      setProfile({ ...demoProfiles[0], fullName, email });
      setOrganisation(demoOrganisation);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) {
      const authUser = { id: data.user.id, email: data.user.email ?? email };
      if (!data.session) {
        setUser(null);
        setProfile(null);
        setOrganisation(null);
        throw new Error("Check your email to confirm the account before the workspace can be created.");
      }
      const workspace =
        (await fetchAuthWorkspace(authUser.id)) ??
        (await createOnboardingWorkspace({
          authUserId: authUser.id,
          email: authUser.email,
          fullName,
          organisationName: organisationName?.trim() || `${fullName.split(" ")[0] || "xDealer"} Workspace`,
        }));
      setUser(authUser);
      setProfile(workspace.profile);
      setOrganisation(workspace.organisation);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setProfile(null);
    setOrganisation(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, organisation, loading, demoMode, signIn, signUp, signOut }),
    [demoMode, loading, organisation, profile, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
