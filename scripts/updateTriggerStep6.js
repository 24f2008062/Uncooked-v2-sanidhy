const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Updating public.handle_new_user() trigger function...");

    const sql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $function$
      BEGIN
        INSERT INTO public."User" (
          id,
          "authUserId",
          email,
          "fullName",
          name,
          role,
          department,
          "updatedAt"
        )
        VALUES (
          concat('usr_', replace(gen_random_uuid()::text, '-', '')),
          new.id::text,
          LOWER(TRIM(new.email)),
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'name',
          'USER',
          new.raw_user_meta_data->>'department',
          NOW()
        )
        ON CONFLICT DO NOTHING;

        RETURN new;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'User sync failed for auth ID %: %', new.id, SQLERRM;
        RETURN new;
      END;
      $function$;
    `;

    await client.query(sql);
    console.log("-> Function public.handle_new_user() successfully updated.");

  } catch (err) {
    console.error("Trigger update error:", err.message);
  } finally {
    await client.end();
  }
}

main();
