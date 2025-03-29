import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { Service } from '@/lib/types';
import { TAX_RATE } from '@/lib/constants';
 
export async function GET() {
  try {
    const query = `
      SELECT 
        q.quote_id,
        c.customer_name,
        TO_CHAR(i.date, 'YYYY-MM-DD"T"HH24:MI:SS') as date,
        q.totalamount,
        q.vin,
        q.po_number,
        q.status,
        q.description,
        q.subtotal,
        q.tax_total,
        q.private_comments
      FROM quotes q
      JOIN customer c ON q.customer_id = c.customer_id
      ORDER BY q.date DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({ 
      quotes: result.rows 
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    });
  } catch (err) {
    console.error('Error fetching quotes:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

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
      services,
    } = await request.json();

    const subtotal = parseFloat(services.reduce((acc: number, service: Service) => {
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + (quantity * unitPrice);
    }, 0).toFixed(2));
    
    const tax_total = parseFloat(services.reduce((acc: number, service: Service) => {
      if (!service.istaxed) return acc;
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + (quantity * unitPrice * TAX_RATE);
    }, 0).toFixed(2));
    
    const total_amount = parseFloat((subtotal + tax_total).toFixed(2));

    const quoteQuery = {
      text: `
        INSERT INTO quotes (
          customer_id,
          date,
          totalamount,
          status,
          po_number,
          description,
          vin,
          private_comments,
          subtotal,
          tax_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING quote_id
      `,
      values: [
        customer_id,
        startDate ? new Date(startDate) : new Date(),
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

    const quoteResult = await client.query(quoteQuery);
    const quote_id = quoteResult.rows[0].quote_id;

    for (const service of services) {
      if (!service.servicename || !service.service_id) continue;
      
      const quantity = Math.max(1, service.quantity || 1);
      const unit_price = Number(service.unitprice) || 0;
      const total_price = unit_price * quantity;

      const detailQuery = {
        text: `
          INSERT INTO quotedetail (
            quote_id,
            service_id,
            quantity,
            unitprice,
            totalprice
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [
          quote_id,
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
      message: 'Quote created successfully',
      quote_id 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}