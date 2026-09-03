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
    
    // Set role to supabase_auth_admin
    await client.query(`SET ROLE supabase_auth_admin;`);
    
    const dummyId = crypto.randomUUID();
    
    console.log("Attempting insert as supabase_auth_admin...");
    await client.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'trigger_test_admin@example.com', 'dummy_hash', 
        now(), '{"name":"Trigger Test"}', now(), now()
      )
    `, [dummyId]);
    
    console.log("Insert successful!");
    
    // Switch back to postgres to clean up
    await client.query(`RESET ROLE;`);
    await client.query(`DELETE FROM auth.users WHERE id = $1`, [dummyId]);
    await client.query(`DELETE FROM public."User" WHERE id = $1`, [dummyId]);
    
  } catch (err) {
    console.error("Error as supabase_auth_admin:", err);
  } finally {
    await client.end();
  }
}

main();
