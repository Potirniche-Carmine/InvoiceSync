import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const quoteId = url.searchParams.get('quoteId');
  
  if (!quoteId) {
    return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
  }
  
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
    
    const result = await pool.query(query, [quoteId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    
    const quote = result.rows[0];
    if (quote.services && quote.services[0] && quote.services[0].service_id === null) {
      quote.services = [];
    }
    
    return NextResponse.json({ quote });
  } catch (err) {
    console.error('Error fetching quote for invoice:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve quote data', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}