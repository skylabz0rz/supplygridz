import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: 'gridz-db',
  database: process.env.POSTGRES_DB || 'supplygridz',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  port: 5432
});

export default pool;
