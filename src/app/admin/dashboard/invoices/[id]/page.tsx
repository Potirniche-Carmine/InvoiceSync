import { notFound } from 'next/navigation';
import InvoiceDetails from '@/app/components/InvoiceDetails';
import type { DetailedInvoice } from '@/app/lib/types';
import { pool } from '@/app/lib/db';

async function getInvoice(id: string): Promise<DetailedInvoice | null> {
  try {
    const query = `
      SELECT 
        i.*,
        c.customer_name,
        c.customer_address,
        json_agg(
          json_build_object(
            'service_id', s.service_id,
            'name', servicename,
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

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return null;
  }
}

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  
  const invoice = await getInvoice(id);
  
  if (!invoice) {
    notFound();
  }

  return <InvoiceDetails invoice={invoice} />;
}