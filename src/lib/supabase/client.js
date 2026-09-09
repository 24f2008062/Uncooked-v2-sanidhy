import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey, issues } = getSupabasePublicConfig();
  if (issues.length && typeof console !== "undefined") {
    console.error("[supabase/client]", issues.join("; "));
  }
  const supabaseUrl = url || "https://placeholder.supabase.co";
  const supabaseKey = anonKey || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}

