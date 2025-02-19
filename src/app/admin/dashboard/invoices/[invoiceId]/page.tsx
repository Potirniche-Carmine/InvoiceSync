import { Suspense } from 'react'
import { getInvoices } from '@/app/lib/data'
import { cn } from '@/app/lib/utils'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Eye, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface Invoice {
  invoice_id: string
  customer_name: string
  date: string
  duedate?: string
  totalamount: number
  status: 'paid' | 'pending' | 'overdue'
}

export default async function InvoicesPage() {
  let invoices: Invoice[] = []
  let error = null

  try {
    invoices = await getInvoices()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load invoices'
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              A list of all invoices from your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<InvoiceTableSkeleton />}>
              <InvoiceTable invoices={invoices} />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No invoices found. Create your first invoice to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableCaption>A list of all invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice_id}>
            <TableCell className="font-medium">{invoice.invoice_id}</TableCell>
            <TableCell>{invoice.customer_name}</TableCell>
            <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
            <TableCell>
              {invoice.duedate
                ? new Date(invoice.duedate).toLocaleDateString()
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              ${invoice.totalamount.toFixed(2)}
            </TableCell>
            <TableCell>
              <div
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  {
                    'bg-green-100 text-green-800': invoice.status === 'paid',
                    'bg-yellow-100 text-yellow-800': invoice.status === 'pending',
                    'bg-red-100 text-red-800': invoice.status === 'overdue',
                  }
                )}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/dashboard/invoices/${invoice.invoice_id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InvoiceTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}