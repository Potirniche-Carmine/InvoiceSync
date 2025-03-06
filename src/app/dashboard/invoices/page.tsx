import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceList from '@/components/InvoiceList';
import InvoiceListSkeleton from '@/components/InvoiceListSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function InvoicesPage() {
  return (
    <div className="container py-6 px-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track your invoices
          </p>
        </div>
        <div className="px-7">
          <Link href="/admin/dashboard/create-invoice">
            <Button variant="default" className="bg-black hover:bg-black/70">
              <Plus className="h-4 w-4" />
              Add New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InvoiceListSkeleton />}>
            <InvoiceList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}