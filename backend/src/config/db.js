import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sslEnabled = process.env.DB_SSL === 'true';

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  ssl: sslEnabled ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
});

export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
