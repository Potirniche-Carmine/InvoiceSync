'use client';

import { useState, useEffect, useCallback } from 'react';
import { DatePicker } from '@/components/datepicker';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Receipt, AlertTriangle, PieChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinancialSummary {
  totalTax: number;
  totalAmount: number;
  invoiceCount: number;
  unpaidTotal: number;
  unpaidCount: number;
}

export default function FinancialSummary() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  
  const fetchSummaryData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (date?.from) params.append('startDate', date.from.toISOString());
      if (date?.to) params.append('endDate', date.to.toISOString());
      
      const response = await fetch(`/api/data/financial-summary?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial summary');
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);
  
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);
  
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Financial Summary</h2>
          <p className="text-muted-foreground">
            {date?.from && date?.to
              ? `From ${date.from.toLocaleDateString()} to ${date.to.toLocaleDateString()}`
              : date?.from
              ? `From ${date.from.toLocaleDateString()}`
              : date?.to
              ? `Until ${date.to.toLocaleDateString()}`
              : 'All time'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePicker date={date} setDate={setDate} />
          <Button 
            variant="outline" 
            onClick={() => {
              setDate(undefined);
              fetchSummaryData();
            }}
            className="whitespace-nowrap"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-row items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(summary?.totalAmount)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? '...' : `${summary?.invoiceCount || 0} invoices`}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-row items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tax</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(summary?.totalTax)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.totalAmount && summary?.totalTax
                  ? `${((summary.totalTax / summary.totalAmount) * 100).toFixed(2)}% of sales`
                  : '0.00% of sales'}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Receipt className="h-6 w-6 text-blue-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-row items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unpaid Accounts</p>
              <h3 className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(summary?.unpaidTotal)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? '...' : `${summary?.unpaidCount || 0} unpaid invoices`}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-row items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
              <h3 className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : summary?.totalAmount && summary?.totalAmount > 0
                  ? `${(((summary.totalAmount - (summary.unpaidTotal || 0)) / summary.totalAmount) * 100).toFixed(2)}%`
                  : '0.00%'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading
                  ? '...'
                  : `${formatCurrency((summary?.totalAmount || 0) - (summary?.unpaidTotal || 0))} collected`}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <PieChart className="h-6 w-6 text-purple-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}