const { Pool } = require('pg');

// Database connection pool setup
const pool = new Pool({
  user: 'postgres',      // Change this to your database username
  host: 'localhost',     // Use the host where your DB is running (localhost if it's local)
  database: 'Raktasangham',  // Change this to your database name
  password: 'mukesh',    // Change this to your DB password
  port: 5432,            // Default PostgreSQL port
});

// Query function to interact with the database
const query = (text, params) => {
  return pool.query(text, params);
};

// Exporting both pool and query
module.exports = { pool, query };
