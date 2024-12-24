import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, date, dueDate, totalAmount, status } = body;

    // Validate required fields as needed:
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Example upsert using ON CONFLICT on invoice_id
    // (requires a UNIQUE constraint on invoice_id in your DB).
    // If instead you have an auto-increment primary key for invoice_id
    // and just want to insert a new row, you can remove the ON CONFLICT part.
    const query = `
      INSERT INTO invoices (customer_id, date, duedate, totalamount, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (invoice_id)
      DO UPDATE 
         SET customer_id = EXCLUDED.customer_id,
             date = EXCLUDED.date,
             duedate = EXCLUDED.duedate,
             totalamount = EXCLUDED.totalamount,
             status = EXCLUDED.status
      RETURNING invoice_id, customer_id, date, duedate, totalamount, status
    `;

    const values = [
      customerId,
      date || null,
      dueDate || null,
      totalAmount || null,
      status || null
    ];

    const result = await pool.query(query, values);
    const invoice = result.rows[0];

    return NextResponse.json({ invoice }, { status: 201 });

  } catch (err) {
    console.error('Error in POST /api/invoices:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
