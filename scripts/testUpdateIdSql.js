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
    
    const adminRes = await client.query(`SELECT id, email FROM public."User" WHERE role = 'SUPER_ADMIN' LIMIT 1`);
    
    if (adminRes.rows.length === 0) {
      console.log("No super admin found");
      return;
    }
    const admin = adminRes.rows[0];
    console.log("Found admin:", admin.email, admin.id);
    
    const newId = crypto.randomUUID();
    console.log("Attempting to update ID to:", newId);
    
    // Test update
    await client.query(`UPDATE public."User" SET id = $1 WHERE id = $2`, [newId, admin.id]);
    console.log("Update successful!");
    
    // Revert
    await client.query(`UPDATE public."User" SET id = $1 WHERE id = $2`, [admin.id, newId]);
    console.log("Reverted successfully.");
  } catch (err) {
    console.error("Error updating ID:", err.message);
  } finally {
    await client.end();
  }
}

main();
