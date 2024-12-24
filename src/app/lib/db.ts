import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

export { pool };

export async function getAllCustomers() {
  const result = await pool.query('SELECT customer_id, customer_name FROM customers ORDER BY customer_name;');
  return result.rows; 
}