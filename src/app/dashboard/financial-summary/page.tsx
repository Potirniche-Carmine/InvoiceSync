import { Suspense } from 'react';
import FinancialSummary from '@/components/financialSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinancialSummaryPage() {
  return (
    <div className="container py-6 px-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Taxes</h1>
          <p className="text-muted-foreground">
            Track your revenue, taxes, and collection metrics
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading financial data...</div>}>
            <FinancialSummary />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}