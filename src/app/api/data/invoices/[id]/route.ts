import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const query = `
      SELECT 
        i.*,
        c.customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        json_agg(
          json_build_object(
            'service_id', s.service_id,
            'name', s.name,
            'description', s.description,
            'quantity', id.quantity,
            'unitprice', id.unitprice,
            'totalprice', id.totalprice
          )
        ) as services
      FROM invoices i
      JOIN customer c ON i.customer_id = c.customer_id
      LEFT JOIN invoicedetail id ON i.invoice_id = id.invoice_id
      LEFT JOIN services s ON id.service_id = s.service_id
      WHERE i.invoice_id = $1
      GROUP BY i.invoice_id, c.customer_id
    `;

    const result = await pool.query(query, [params.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}