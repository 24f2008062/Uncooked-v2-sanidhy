const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const adminRes = await client.query(`SELECT id, email, "passwordHash" FROM public."User" WHERE role = 'SUPER_ADMIN' LIMIT 1`);
    
    if (adminRes.rows.length === 0) {
      console.log("No super admin found");
      return;
    }
    const admin = adminRes.rows[0];
    console.log("Found admin:", admin.email, admin.id);
    console.log("Has Password Hash:", !!admin.passwordHash);
    
    if (admin.passwordHash) {
      console.log("Hash starts with:", admin.passwordHash.substring(0, 15) + "...");
    } else {
      console.log("Password hash is NULL! This means they were ALREADY MIGRATED.");
    }
    
    const authRes = await client.query(`SELECT id, email FROM auth.users WHERE email = $1`, [admin.email]);
    if (authRes.rows.length > 0) {
      console.log("Admin exists in auth.users:", authRes.rows[0].id);
    } else {
      console.log("Admin DOES NOT exist in auth.users.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main();
