import CreateInvoiceForm from '@/app/components/createInvoiceForm'
import { Suspense } from 'react'

export default function CreateInvoicePage() {
  <Suspense fallback={<div>Loading...</div>}>
  return <CreateInvoiceForm />
  </Suspense>
}