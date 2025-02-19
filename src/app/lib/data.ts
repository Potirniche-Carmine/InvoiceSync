export async function getInvoices() {
  const res = await fetch('/api/data/invoices')
  if (!res.ok) {
    throw new Error('Failed to fetch invoices')
  }
  const data = await res.json()
  return data.invoices
}