import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Get detailed quote data
async function getQuote(id: string) {
  try {
    const query = `
      SELECT 
        q.*,
        c.customer_id,
        c.customer_name,
        c.customer_address,
        COALESCE(
          json_agg(
            json_build_object(
              'service_id', s.service_id,
              'servicename', s.servicename,
              'description', s.description,
              'quantity', qd.quantity,
              'unitprice', qd.unitprice,
              'totalprice', qd.totalprice,
              'istaxed', s.istaxed
            )
          ) FILTER (WHERE s.service_id IS NOT NULL),
          '[]'::json
        ) as services
      FROM quotes q
      JOIN customer c ON q.customer_id = c.customer_id
      LEFT JOIN quotedetail qd ON q.quote_id = qd.quote_id
      LEFT JOIN services s ON qd.service_id = s.service_id
      WHERE q.quote_id = $1
      GROUP BY q.quote_id, c.customer_id, c.customer_name, c.customer_address
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const quote = result.rows[0];
    if (quote.services && quote.services[0] && quote.services[0].service_id === null) {
      quote.services = [];
    }
    
    return quote;
  } catch (err) {
    console.error('Error fetching quote:', err);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Get quote data
    const quote = await getQuote(id);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    const { dueDate } = await request.json();
    
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
        quote.customer_id,
        new Date(), // current date for the invoice
        dueDate ? new Date(dueDate) : null,
        quote.totalamount,
        'pending',
        quote.po_number,
        quote.description,
        quote.vin,
        quote.private_comments,
        quote.subtotal,
        quote.tax_total
      ]
    };

    const invoiceResult = await client.query(invoiceQuery);
    const invoice_id = invoiceResult.rows[0].invoice_id;

    // Add all services from the quote to the invoice
    for (const service of quote.services) {
      if (!service.servicename || !service.service_id) continue;
      
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
          service.quantity,
          service.unitprice,
          service.totalprice
        ]
      };

      await client.query(detailQuery);
    }

    // Update quote status to 'accepted'
    await client.query(
      'UPDATE quotes SET status = $1 WHERE quote_id = $2',
      ['accepted', id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Quote converted to invoice successfully',
      invoice_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error converting quote to invoice:', error);
    return NextResponse.json(
      { error: 'Failed to convert quote to invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}