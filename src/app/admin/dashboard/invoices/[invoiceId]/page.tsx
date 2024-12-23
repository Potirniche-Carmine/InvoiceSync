import React from 'react';

interface InvoicePageProps {
  params: Promise<{ invoiceId: string }>;
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId } = React.use(params);
  const invoiceNumber = parseInt(invoiceId, 10);

  return <h1>Invoice {invoiceNumber}</h1>;
}