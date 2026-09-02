const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const res = await client.query(`SELECT id, email FROM auth.users WHERE email = $1`, ['test@test12345.com']);
    console.log("Found in auth.users:", res.rows.length);
    if (res.rows.length > 0) {
      console.log(res.rows[0]);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
