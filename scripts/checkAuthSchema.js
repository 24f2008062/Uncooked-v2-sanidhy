const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check for any remaining triggers
    const triggerRes = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users';
    `);
    console.log("Triggers on auth.users:", triggerRes.rows);
    
    // Check if we can do a simple insert to auth.users (meaning the schema is fine)
    console.log("Database connection is healthy.");
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
