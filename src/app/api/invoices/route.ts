import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, amount, description } = body;

    const query = `
      INSERT INTO invoice (customer_id, amount, description, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING invoice_id, customer_id, amount, description, created_at
    `;
    const values = [customer_id, amount, description];

    const result = await pool.query(query, values);
    return NextResponse.json({ invoice: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}