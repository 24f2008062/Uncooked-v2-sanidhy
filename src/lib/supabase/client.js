import { createBrowserClient } from '@supabase/ssr';

let client;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uncooked-dev-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key'
  );

  return client;
}
