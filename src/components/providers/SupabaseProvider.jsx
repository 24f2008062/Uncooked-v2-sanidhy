"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const Context = createContext({ data: null, status: "loading" });

export default function SupabaseProvider({ children }) {
  const [session, setSession] = useState({ data: null, status: "loading" });
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session: activeSession }, error } = await supabase.auth.getSession();
      if (mounted) {
        if (error || !activeSession) {
          setSession({ data: null, status: "unauthenticated" });
        } else {
          // Mapping Supabase session to match next-auth user format
          const formattedSession = {
            ...activeSession,
            user: {
              ...activeSession.user,
              id: activeSession.user.id,
              email: activeSession.user.email,
              name: activeSession.user.user_metadata?.name || activeSession.user.email,
              role: activeSession.user.user_metadata?.role || "USER",
            }
          };
          setSession({ data: formattedSession, status: "authenticated" });
        }
      }
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (activeSession) {
        const formattedSession = {
          ...activeSession,
          user: {
            ...activeSession.user,
            id: activeSession.user.id,
            email: activeSession.user.email,
            name: activeSession.user.user_metadata?.name || activeSession.user.email,
            role: activeSession.user.user_metadata?.role || "USER",
          }
        };
        setSession({ data: formattedSession, status: "authenticated" });
      } else {
        setSession({ data: null, status: "unauthenticated" });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export function useSession() {
  return useContext(Context);
}
