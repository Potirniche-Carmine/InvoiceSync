'use client';

import { Suspense } from 'react';
import CreateInvoiceForm from '@/components/createInvoiceForm';

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-4">Loading invoice form...</div>}>
      <CreateInvoiceForm />
    </Suspense>
  );
}