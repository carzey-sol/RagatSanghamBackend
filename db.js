const { Pool } = require('pg');

// Database connection pool setup
const pool = new Pool({
  user: 'mukesh',     
  host: 'dpg-ctl52tij1k6c73ctvpgg-a',     
  database: 'ragatsanghamdb',  
  password: 'AhqWU04FDO68PKEwL8ZjqZ7tGAgVEsjU',  
  port: 5432,          
});

// Query function to interact with the database
const query = (text, params) => {
  return pool.query(text, params);
};

// Exporting both pool and query
module.exports = { pool, query };
