import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id,  } = body;

    const query = `
      INSERT INTO invoice (customer_id, date, duedate, totalamount, status)
      VALUES ($1, $2, $3, NOW())
      RETURNING invoice_id, customer_id, amount, description, created_at
    `;

  } catch (err) {
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}