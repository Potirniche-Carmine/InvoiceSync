'use client'

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';
import { DatePicker } from '@/components/datepicker';
import useSWR from 'swr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define a Quote type similar to the Invoice type
interface Quote {
  quote_id: string;
  customer_name: string;
  date: string;
  totalamount: number;
  status: 'pending' | 'accepted' | 'rejected';
  po_number: string;
  vin: string;
  description: string;
  subtotal: number;
  tax_total: number;
  private_comments: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function QuoteList() {
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [filters, setFilters] = useState({
    quoteNumber: '',
    customerName: '',
    poNumber: '',
    vin: '',
    status: 'all',
    dateRange: undefined as DateRange | undefined

  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setQuoteToConvert] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const refreshParam = searchParams.get('refresh');

  const { data, error, isLoading, mutate } = useSWR('/api/data/quotes', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: refreshParam ? 0 : 60000, // No dedupe if refresh param is present
    refreshInterval: 300000,
  });

  useEffect(() => {
    if (refreshParam) {
      mutate();

      const params = new URLSearchParams(window.location.search);
      params.delete('refresh');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [refreshParam, mutate]);

  useEffect(() => {
    if (!data?.quotes) return;
  
    const filtered = data.quotes.filter((quote: Quote) => {
      const matchesQuoteNumber = String(quote.quote_id)
        .toLowerCase()
        .includes(filters.quoteNumber.toLowerCase());
      const matchesCustomer = quote.customer_name.toLowerCase()
        .includes(filters.customerName.toLowerCase());
      const matchesPO = (quote.po_number || '').toLowerCase()
        .includes(filters.poNumber.toLowerCase());
      const matchesVIN = (quote.vin || '').toLowerCase()
        .includes(filters.vin.toLowerCase());
      const matchesStatus = filters.status === 'all' || quote.status === filters.status;
  
      let matchesDateRange = true;
      if (filters.dateRange && filters.dateRange.from) {
        const quoteDate = new Date(quote.date);
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
  
        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = quoteDate >= fromDate && quoteDate <= toDate;
        } else {
          matchesDateRange = quoteDate.toDateString() === fromDate.toDateString();
        }
      }
  
      return matchesQuoteNumber && matchesCustomer && matchesPO &&
        matchesVIN && matchesStatus && matchesDateRange;
    });
  
    const sorted = [...filtered].sort((a, b) => {
      const idA = typeof a.quote_id === 'string' ? parseInt(a.quote_id) : a.quote_id;
      const idB = typeof b.quote_id === 'string' ? parseInt(b.quote_id) : b.quote_id;
  
      return idB - idA;
    });
  
    setFilteredQuotes(sorted);
  }, [filters, data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };

  const handleConvertToInvoice = (quoteId: string) => {
    setQuoteToConvert(quoteId);
    window.location.href = `/dashboard/create-invoice?from_quote=${quoteId}`;
  };

  const handlePrintQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/data/quotes/${quoteId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF for printing');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);

      if (printWindow) {
        printWindow.onload = function () {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Error printing quote:', err);
    }
  };

  const handleDownloadQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/data/quotes/${quoteId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const confirmDeleteQuote = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuote = async () => {
    if (!quoteToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/data/quotes/${quoteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      setDeleteDialogOpen(false);
      mutate();
    } catch (err) {
      console.error('Error deleting quote:', err);
    } finally {
      setIsDeleting(false);
      setQuoteToDelete(null);
    }
  };

  if (error) {
    return <div className="text-center py-6 text-red-600">Failed to load quotes</div>;
  }

  if (isLoading) {
    return <div className="text-center py-6">Loading quotes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Search Quote #"
          value={filters.quoteNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            quoteNumber: e.target.value
          }))}
        />
        <Input
          placeholder="Search Customer"
          value={filters.customerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            customerName: e.target.value
          }))}
        />
        <Input
          placeholder="Search PO #"
          value={filters.poNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            poNumber: e.target.value
          }))}
        />
        <Input
          placeholder="Search VIN"
          value={filters.vin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            vin: e.target.value
          }))}
        />
        <Select
          value={filters.status}
          onValueChange={(value: string) => setFilters(prev => ({
            ...prev,
            status: value
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker
          date={filters.dateRange}
          setDate={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
        />
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No quotes found.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.quote_id}>
                  <TableCell className="font-medium p-0">
                    <Link
                      href={`/dashboard/quotes/${quote.quote_id}`}
                      className="block w-full text-left px-6 py-4 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {quote.quote_id}
                    </Link>
                  </TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell>
                    {quote.date
                      ? new Date(quote.date)
                        .toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          timeZone: 'UTC' 
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{quote.po_number || 'N/A'}</TableCell>
                  <TableCell>{quote.vin || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(quote.totalamount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quote.status || 'pending')}>
                      {(quote.status || 'pending').charAt(0).toUpperCase() +
                        (quote.status || 'pending').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-0">
                    <div className="flex items-center justify-center gap-1 h-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center text-blue-600"
                        onClick={() => handleConvertToInvoice(quote.quote_id)}
                      >
                        <FileText className="h-8 w-8" />
                        <span className="sr-only">Convert to Invoice</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => handlePrintQuote(quote.quote_id)}
                      >
                        <Printer className="h-8 w-8" />
                        <span className="sr-only">Print quote</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => handleDownloadQuote(quote.quote_id)}
                      >
                        <Download className="h-8 w-8" />
                        <span className="sr-only">Download quote</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-100 rounded-full h-10 w-10 p-0 flex items-center justify-center text-red-600"
                        onClick={() => confirmDeleteQuote(quote.quote_id)}
                      >
                        <Trash2 className="h-8 w-8" />
                        <span className="sr-only">Delete quote</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quote #{quoteToDelete}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuote}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}