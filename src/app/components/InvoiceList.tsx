'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { CircleDollarSign, Printer, Download} from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import type { Invoice } from '@/app/lib/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InvoiceList() {
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState({
    invoiceNumber: '',
    customerName: '',
    poNumber: '',
    vin: '',
    status: 'all'
  });

  const { data, error, isLoading } = useSWR('/api/data/invoices', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    refreshInterval: 300000,
  });

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

      return matchesInvoiceNumber && matchesCustomer && matchesPO &&
        matchesVIN && matchesStatus;
    });

    setFilteredInvoices(filtered);
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
    console.log(`Invoice ${invoiceId} paid by ${method}`);
  };

  const handlePrintInvoice = (invoiceId: string) => {
    console.log(`Printing invoice ${invoiceId}`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log(`Downloading invoice ${invoiceId}`);
  };

  if (error) {
    return <div className="text-center py-6 text-red-600">Failed to load invoices</div>;
  }

  if (isLoading) {
    return <div className="text-center py-6">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <Input
          placeholder="Search Invoice #"
          value={filters.invoiceNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({
            ...prev,
            invoiceNumber: e.target.value
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
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
                      href={`/admin/dashboard/invoices/${invoice.invoice_id}`}
                      className="block w-full text-left px-6 py-4 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {invoice.invoice_id}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>
                    {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {invoice.duedate
                      ? new Date(invoice.duedate).toLocaleDateString()
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}