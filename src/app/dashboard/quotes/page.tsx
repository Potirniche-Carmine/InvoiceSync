import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuoteList from '@/components/QuoteList';
import QuoteListSkeleton from '@/components/QuoteListSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function QuotesPage() {
  return (
    <div className="container py-6 px-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Manage and track your quotes
          </p>
        </div>
        <div className="px-7">
          <Link href="/dashboard/create-quote">
            <Button variant="default" className="bg-black hover:bg-black/70">
              <Plus className="h-4 w-4" />
              Add New Quote
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<QuoteListSkeleton />}>
            <QuoteList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}