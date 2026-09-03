const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database...");

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
    `;
    
    await client.query(sql);
    console.log("Trigger function updated successfully.");
  } catch (err) {
    console.error("Error updating trigger:", err);
  } finally {
    await client.end();
  }
}

main();
