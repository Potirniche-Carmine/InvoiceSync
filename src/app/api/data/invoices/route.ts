import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

const TAX_RATE = 0.0875;

export async function POST(request: Request) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_id,
      PO,
      description,
      comments,
      vin,
      startDate,
      dueDate,
      services,
    } = await request.json();

    console.log('Services received:', services);

    const subtotal = services.reduce((acc: number, service: { unitprice: number }) =>
      acc + (Number(service.unitprice) || 0), 0
    );
  
    const tax_total = services.reduce((acc: number, service: { unitprice: number, isTaxed: boolean }) =>
      acc + (service.isTaxed ? (Number(service.unitprice) * TAX_RATE) : 0), 0
    );
    
    const total_amount = subtotal + tax_total;

    const invoiceQuery = {
      text: `
        INSERT INTO invoices (
          customer_id,
          date,
          duedate,
          totalamount,
          status,
          po_number,
          description,
          vin,
          private_comments,
          subtotal,
          tax_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING invoice_id
      `,
      values: [
        customer_id,
        startDate ? new Date(startDate) : new Date(),
        dueDate ? new Date(dueDate) : null,
        total_amount,
        'pending',
        PO,
        description,
        vin,
        comments,
        subtotal,
        tax_total
      ]
    };

    const invoiceResult = await client.query(invoiceQuery);
    const invoice_id = invoiceResult.rows[0].invoice_id;

    for (const service of services) {
      console.log('Processing service:', service);
      
      const quantity = 1;
      const unit_price = Number(service.unitprice) || 0;
      const total_price = unit_price * quantity;

      const detailQuery = {
        text: `
          INSERT INTO invoicedetail (
            invoice_id,
            service_id,
            quantity,
            unitprice,
            totalprice
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [
          invoice_id,
          service.service_id,
          quantity,
          unit_price,
          total_price
        ]
      };

      await client.query(detailQuery);
    }
    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice created successfully',
      invoice_id 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET() {
  try {
    const query = `
      SELECT 
        i.invoice_id,
        c.customer_name,
        i.date,
        i.duedate,
        i.totalamount,
        i.vin,
        i.po_number,
        i.status,
        i.description,
        i.subtotal,
        i.tax_total,
        i.private_comments
      FROM invoices i
      JOIN customer c ON i.customer_id = c.customer_id
      ORDER BY i.date DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({ 
      invoices: result.rows 
    }, {
      headers: {
        // Cache for 1 minute on client side
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });
    
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}