import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'supplygridz',
  password: process.env.POSTGRES_PASSWORD || 'X8r9vPq2wLmA',  // <-- updated fallback
  port: 5432
});

export default pool;


