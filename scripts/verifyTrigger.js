const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Create a dummy UUID
    const dummyId = crypto.randomUUID();
    
    // Attempt to insert into auth.users to fire the trigger
    await client.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'trigger_verify@example.com', 'dummy_hash', 
        now(), '{"name":"Trigger Test"}', now(), now()
      )
    `, [dummyId]);
    
    // Verify it was copied to public."User"
    const res = await client.query(`SELECT * FROM public."User" WHERE id = $1`, [dummyId]);
    console.log("Found in public.User:", res.rows.length);
    if (res.rows.length > 0) {
      console.log("Trigger successfully synced user!");
    } else {
      console.log("TRIGGER DID NOT RUN! The user is missing from public.User!");
    }
    
    // Clean up
    await client.query(`DELETE FROM auth.users WHERE id = $1`, [dummyId]);
    await client.query(`DELETE FROM public."User" WHERE id = $1`, [dummyId]);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
