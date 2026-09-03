const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log("=== CHECKING AUTH USER d94f2ed1-5bc0-4d36-8193-ad826587d343 ===");
    const authRes = await client.query(`SELECT id, email, email_confirmed_at FROM auth.users WHERE id = 'd94f2ed1-5bc0-4d36-8193-ad826587d343'`);
    console.log("Auth user count:", authRes.rows.length);
    if (authRes.rows.length > 0) {
      console.log("Auth user details:", authRes.rows[0]);
    }

    console.log("\n=== CHECKING PUBLIC USER d94f2ed1-5bc0-4d36-8193-ad826587d343 ===");
    const publicRes = await client.query(`SELECT id, email, role FROM public."User" WHERE id = 'd94f2ed1-5bc0-4d36-8193-ad826587d343'`);
    console.log("Public user count:", publicRes.rows.length);
    if (publicRes.rows.length > 0) {
      console.log("Public user details:", publicRes.rows[0]);
    }

    console.log("\n=== CHECKING ALL AUTH USERS AND MAPPING TO PUBLIC USER ===");
    const allAuth = await client.query(`
      SELECT 
        a.id::text as auth_id, 
        a.email as auth_email, 
        p.id as public_id, 
        p.email as public_email
      FROM auth.users a
      LEFT JOIN public."User" p ON a.id::text = p.id
      LIMIT 10
    `);
    console.log(allAuth.rows);

    console.log("\n=== CHECKING TRIGGER DEFINITION handle_new_user ===");
    const triggerDef = await client.query(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    if (triggerDef.rows.length > 0) {
      console.log(triggerDef.rows[0].pg_get_functiondef);
    } else {
      console.log("No handle_new_user function found!");
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main();
