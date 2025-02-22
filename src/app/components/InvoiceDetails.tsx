'use client';

import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/app/components/ui/table';
import { Download, Printer } from 'lucide-react';
import type { DetailedInvoice } from '@/app/lib/types';

interface InvoiceDetailsProps {
  invoice: DetailedInvoice;
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Invoice #{invoice.invoice_id}
          </h1>
          <Badge className={`${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Customer Name</h3>
              <p className="text-lg font-semibold">{invoice.customer_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Contact Details</h3>
              <p>{invoice.customer_email}</p>
              <p>{invoice.customer_phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="whitespace-pre-line">{invoice.customer_address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                <p>{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                <p>{invoice.duedate ? new Date(invoice.duedate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">PO Number</h3>
                <p>{invoice.po_number || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">VIN</h3>
                <p>{invoice.vin || 'N/A'}</p>
              </div>
            </div>
            {invoice.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p>{invoice.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.services.map((service) => (
                <TableRow key={service.service_id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell className="text-right">{service.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${service.unitprice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${service.totalprice.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Subtotal
                </TableCell>
                <TableCell className="text-right">
                  ${invoice.subtotal.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Tax
                </TableCell>
                <TableCell className="text-right">
                  ${invoice.tax_total.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${invoice.totalamount.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Private Comments */}
      {invoice.private_comments && (
        <Card>
          <CardHeader>
            <CardTitle>Private Comments</CardTitle>
            <CardDescription>Internal notes about this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{invoice.private_comments}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}