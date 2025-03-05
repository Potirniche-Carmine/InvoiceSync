import { notFound } from 'next/navigation';
import CreateInvoiceForm from '@/app/components/createInvoiceForm';
import type { DetailedInvoice } from '@/app/lib/types';
import { pool } from '@/app/lib/db';

async function getInvoice(id: string): Promise<DetailedInvoice | null> {
  try {
    const query = `
      SELECT 
        i.*,
        c.customer_id,
        c.customer_name,
        c.customer_address,
        COALESCE(
          json_agg(
            json_build_object(
              'service_id', s.service_id,
              'servicename', s.servicename,
              'description', s.description,
              'quantity', id.quantity,
              'unitprice', id.unitprice,
              'totalprice', id.totalprice,
              'istaxed', s.istaxed
            )
          ) FILTER (WHERE s.service_id IS NOT NULL),
          '[]'::json
        ) as services
      FROM invoices i
      JOIN customer c ON i.customer_id = c.customer_id
      LEFT JOIN invoicedetail id ON i.invoice_id = id.invoice_id
      LEFT JOIN services s ON id.service_id = s.service_id
      WHERE i.invoice_id = $1
      GROUP BY i.invoice_id, c.customer_id, c.customer_name, c.customer_address
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const invoice = result.rows[0];
    if (invoice.services && invoice.services[0] && invoice.services[0].service_id === null) {
      invoice.services = [];
    }
    
    return invoice;
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return null;
  }
}

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const awaitedParams = await params;
  const id = awaitedParams.id;
  
  const invoice = await getInvoice(id);
  
  if (!invoice) {
    notFound();
  }

  return (
    <CreateInvoiceForm 
      mode="edit" 
      initialInvoice={invoice} 
    />
  );
}