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
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public."User" (id, email, "fullName", name, role, department, "updatedAt")
        VALUES (
          new.id,
          new.email,
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'name',
          'USER',
          new.raw_user_meta_data->>'department',
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    await client.query(sql);
    console.log("Trigger enabled successfully.");
  } catch (err) {
    console.error("Error enabling trigger:", err);
  } finally {
    await client.end();
  }
}

main();
