import { notFound } from 'next/navigation';
import CreateQuoteForm from '@/components/createQuoteForm';
import { pool } from '@/lib/db';
import type { DetailedQuote } from '@/lib/types';


async function getQuote(id: string): Promise<DetailedQuote | null> {
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

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const awaitedParams = await params;
  const id = awaitedParams.id;
  
  const quote = await getQuote(id);
  
  if (!quote) {
    notFound();
  }

  return (
    <CreateQuoteForm 
      mode="edit" 
      initialQuote={quote} 
    />
  );
}