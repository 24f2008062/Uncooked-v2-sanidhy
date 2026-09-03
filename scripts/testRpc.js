const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'update_user_password';
    `);
    
    if (res.rows.length > 0) {
      console.log("RPC function 'update_user_password' EXISTS.");
    } else {
      console.log("RPC function 'update_user_password' DOES NOT EXIST!");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
