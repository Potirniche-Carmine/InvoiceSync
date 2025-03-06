import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const query = `
      INSERT INTO customer (customer_name, customer_address)
      VALUES ($1, $2)
      ON CONFLICT (customer_name)
      DO UPDATE SET customer_address = EXCLUDED.customer_address
      RETURNING customer_id, customer_name, customer_address
    `;
    const values = [name, address || null];

    const result = await pool.query(query, values);

    const customer = result.rows[0];

    return NextResponse.json({ customer }, { status: 201 });

  } catch (err) {
    console.error('Error in POST /api/customers:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const query = `
      SELECT customer_id, customer_name, customer_address 
      FROM customer 
      ORDER BY customer_name
    `;
    
    const result = await pool.query(query);
    return NextResponse.json({ customers: result.rows });
  } catch (err) {
    console.error('Error fetching customers:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
