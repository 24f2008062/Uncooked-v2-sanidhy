"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const Context = createContext({
  data: null,
  status: "loading",
  refreshSession: async () => {},
  signOut: async () => {},
});

function formatSession(activeSession) {
  if (!activeSession?.user) return null;
  return {
    ...activeSession,
    user: {
      ...activeSession.user,
      id: activeSession.user.id,
      email: activeSession.user.email,
      name: activeSession.user.user_metadata?.name || activeSession.user.email,
      role: activeSession.user.app_metadata?.role || "USER",
    },
  };
}

export default function SupabaseProvider({ children }) {
  const [session, setSession] = useState({ data: null, status: "loading" });
  const supabase = useMemo(() => createClient(), []);

  const refreshSession = useCallback(async () => {
    const isPlaceholder =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    if (isPlaceholder) {
      setSession({ data: null, status: "unauthenticated" });
      return null;
    }
    try {
      const {
        data: { session: activeSession },
        error,
      } = await supabase.auth.getSession();
      if (!error && activeSession) {
        const formatted = formatSession(activeSession);
        setSession({ data: formatted, status: "authenticated" });
        return formatted;
      }

      // Fallback: Check if server-side session exists via /api/user/profile
      try {
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.data?.user) {
            const u = profileData.data.user;
            const serverSession = {
              user: {
                id: u.id,
                email: u.email,
                name: u.fullName || u.name || u.email,
                role: u.role || "USER",
              },
            };
            setSession({ data: serverSession, status: "authenticated" });
            return serverSession;
          }
        }
      } catch {
        /* ignore network/server profile fetch failures */
      }

      setSession({ data: null, status: "unauthenticated" });
      return null;
    } catch {
      setSession({ data: null, status: "unauthenticated" });
      return null;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setSession({ data: null, status: "unauthenticated" });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await refreshSession();
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (!mounted) return;
      if (activeSession) {
        setSession({ data: formatSession(activeSession), status: "authenticated" });
      } else {
        setSession({ data: null, status: "unauthenticated" });
      }
    });

    // After server-side cookie login, soft navigations won't remount — refresh on focus.
    const onFocus = () => {
      refreshSession();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshSession, supabase]);

  const value = useMemo(
    () => ({
      data: session.data,
      status: session.status,
      refreshSession,
      signOut,
    }),
    [session.data, session.status, refreshSession, signOut]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  return useContext(Context);
}
