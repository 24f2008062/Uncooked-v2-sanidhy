const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const sql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

      GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public."User" (id, email, "fullName", name, role, department, "updatedAt")
        VALUES (
          new.id::text,
          new.email,
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'name',
          'USER',
          new.raw_user_meta_data->>'department',
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'User sync failed: %', SQLERRM;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    await client.query(sql);
    console.log("Bulletproof trigger installed successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
