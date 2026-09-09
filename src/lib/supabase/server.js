import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  const { url, anonKey, issues } = getSupabasePublicConfig();
  if (issues.length) {
    console.error("[supabase/server]", issues.join("; "));
  }
  const supabaseUrl = url || "https://placeholder.supabase.co";
  const supabaseKey = anonKey || "placeholder-anon-key";

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
