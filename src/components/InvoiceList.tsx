'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { DatePicker } from '@/components/datepicker';
import { DateRange } from 'react-day-picker';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleDollarSign, Printer, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/types';
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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InvoiceList() {
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState({
    invoiceNumber: '',
    customerName: '',
    poNumber: '',
    vin: '',
    status: 'all',
    dateRange: undefined as DateRange | undefined
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchParams = useSearchParams();
  const refreshParam = searchParams.get('refresh');

  const { data, error, isLoading, mutate } = useSWR('/api/data/invoices', fetcher, {
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
    if (!data?.invoices) return;

    const filtered = data.invoices.filter((invoice: Invoice) => {
      const matchesInvoiceNumber = String(invoice.invoice_id)
        .toLowerCase()
        .includes(filters.invoiceNumber.toLowerCase());
      const matchesCustomer = invoice.customer_name.toLowerCase()
        .includes(filters.customerName.toLowerCase());
      const matchesPO = (invoice.po_number || '').toLowerCase()
        .includes(filters.poNumber.toLowerCase());
      const matchesVIN = (invoice.vin || '').toLowerCase()
        .includes(filters.vin.toLowerCase());
      const matchesStatus = filters.status === 'all' || invoice.status === filters.status;

      let matchesDateRange = true;
      if (filters.dateRange && filters.dateRange.from) {
        const invoiceDate = new Date(invoice.date);
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = invoiceDate >= fromDate && invoiceDate <= toDate;
        } else {
          matchesDateRange = invoiceDate.toDateString() === fromDate.toDateString();
        }
      }

      return matchesInvoiceNumber && matchesCustomer && matchesPO &&
        matchesVIN && matchesStatus && matchesDateRange;
    });

    const sorted = [...filtered].sort((a, b) => {
      const idA = typeof a.invoice_id === 'string' ? parseInt(a.invoice_id) : a.invoice_id;
      const idB = typeof b.invoice_id === 'string' ? parseInt(b.invoice_id) : b.invoice_id;

      return idB - idA;
    });

    setFilteredInvoices(sorted);
  }, [filters, data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
  };

  const handlePaymentMethod = async (invoiceId: string, method: string) => {
    try {

      const response = await fetch(`/api/data/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process payment with ${method}`);
      }

      await mutate();

    } catch (error) {
      console.error(`Error processing payment for invoice ${invoiceId}:`, error);
    }
  };
  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/data/invoices/${invoiceId}/pdf`, {
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
      console.error('Error printing invoice:', err);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/data/invoices/${invoiceId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const confirmDeleteInvoice = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/data/invoices/${invoiceToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      setDeleteDialogOpen(false);
      mutate();
    } catch (err) {
      console.error('Error deleting invoice:', err);
    } finally {
      setIsDeleting(false);
      setInvoiceToDelete(null);
    }
  };

  if (error) {
    return <div className="text-center py-6 text-red-600">Failed to load invoices</div>;
  }

  if (isLoading) {
    return <div className="text-center py-6">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Invoice #"
          value={filters.invoiceNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            invoiceNumber: e.target.value
          }))}
          className="text-sm h-9"
        />
        <Input
          placeholder="Customer"
          value={filters.customerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            customerName: e.target.value
          }))}
          className="text-sm h-9"
        />
        <Input
          placeholder="PO #"
          value={filters.poNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            poNumber: e.target.value
          }))}
          className="text-sm h-9"
        />
        <Input
          placeholder="VIN"
          value={filters.vin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            vin: e.target.value
          }))}
          className="text-sm h-9"
        />
        <Select
          value={filters.status}
          onValueChange={(value: string) => setFilters(prev => ({
            ...prev,
            status: value
          }))}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker
          date={filters.dateRange}
          setDate={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No invoices found.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.invoice_id}>
                  <TableCell className="font-medium p-0">
                    <Link
                      href={`/dashboard/invoices/${invoice.invoice_id}`}
                      className="block w-full text-left px-6 py-4 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {invoice.invoice_id}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>
                    {invoice.date
                      ? new Date(invoice.date)
                        .toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          timeZone: 'UTC' 
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {invoice.duedate
                      ? new Date(invoice.duedate)
                        .toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          timeZone: 'UTC' 
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{invoice.po_number || 'N/A'}</TableCell>
                  <TableCell>{invoice.vin || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.totalamount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status || 'pending')}>
                      {(invoice.status || 'pending').charAt(0).toUpperCase() +
                        (invoice.status || 'pending').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-0">
                    <div className="flex items-center justify-center gap-1 h-full">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                          >
                            <CircleDollarSign className="h-8 w-8" />
                            <span className="sr-only">Open payment menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Paid by:</DropdownMenuLabel>
                          {['Check', 'Cash', 'Card', 'Zelle', 'Venmo', 'Cashapp', 'Apple Pay'].map((method) => (
                            <DropdownMenuItem
                              key={method}
                              onClick={() => handlePaymentMethod(invoice.invoice_id, method)}
                            >
                              {method}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => handlePrintInvoice(invoice.invoice_id)}
                      >
                        <Printer className="h-8 w-8" />
                        <span className="sr-only">Print invoice</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => handleDownloadInvoice(invoice.invoice_id)}
                      >
                        <Download className="h-8 w-8" />
                        <span className="sr-only">Download invoice</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-100 rounded-full h-10 w-10 p-0 flex items-center justify-center text-red-600"
                        onClick={() => confirmDeleteInvoice(invoice.invoice_id)}
                      >
                        <Trash2 className="h-8 w-8" />
                        <span className="sr-only">Delete invoice</span>
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
              Are you sure you want to delete invoice #{invoiceToDelete}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}