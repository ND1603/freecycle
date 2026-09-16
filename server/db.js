const { Pool } = require('pg');
require('dotenv').config();

// Initialize the Postgres Pool with your Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required for Neon cloud connections over SSL
    rejectUnauthorized: false
  }
});

// Test the database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring Neon client:', err.stack);
  }
  console.log('⚡ Successfully connected to Neon PostgreSQL!');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  // For multi-step operations that need to succeed or fail together
  // (e.g. creating a claim + marking the item claimed + starting a
  // conversation, all at once). Caller is responsible for
  // client.query('BEGIN') / 'COMMIT' / 'ROLLBACK' and client.release().
  getClient: () => pool.connect(),
};
