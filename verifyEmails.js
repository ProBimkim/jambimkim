const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query('UPDATE "user" SET "emailVerified" = true RETURNING *');
  console.log(`Updated ${result.rowCount} users to emailVerified = true`);
  process.exit(0);
}

main().catch(console.error);
