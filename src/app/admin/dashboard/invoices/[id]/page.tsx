import { notFound } from 'next/navigation';
import InvoiceDetails from '@/app/components/InvoiceDetails';
import type { DetailedInvoice } from '@/app/lib/types';

async function getInvoice(id: string): Promise<DetailedInvoice | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await getInvoice(params.id);
  
  if (!invoice) {
    notFound();
  }

  return <InvoiceDetails invoice={invoice} />;
}