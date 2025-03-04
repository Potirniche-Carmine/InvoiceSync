'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerSelect from '@/app/components/customer_select'
import { Customer, Service } from '@/app/lib/types'
import { Button } from '@/app/components/ui/button'
import { Plus, CircleX, Save, Printer, Download } from "lucide-react"
import ServiceSelect from '@/app/components/services_select'
import { DatePicker } from '@/app/components/datepicker'
import { DateRange } from "react-day-picker"
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { DetailedInvoice } from '@/app/lib/types'

const TAX_RATE = 0.0875

interface EditInvoiceFormProps {
  invoice: DetailedInvoice;
}

export default function EditInvoiceForm({ invoice }: EditInvoiceFormProps) {
  const router = useRouter();
  
  // Extract the initial customer from the invoice
  const initialCustomer: Customer = {
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    customer_address: invoice.customer_address || ''
  };

  // Format services from the invoice for the form
  const formatInvoiceServices = (): (Service | undefined)[] => {
    if (!invoice.services || invoice.services.length === 0) {
      return [undefined];
    }
    
    return invoice.services.map(s => ({
        service_id: parseInt(String(s.service_id)),
        servicename: s.servicename,
        description: s.description,
        unitprice: s.unitprice,
        istaxed: s.istaxed
      }));
    };

  const parseDateRange = (): DateRange | undefined => {
    const from = invoice.date ? new Date(invoice.date) : undefined;
    const to = invoice.duedate ? new Date(invoice.duedate) : undefined;
    
    if (!from) return undefined;
    
    return { from, to };
  };

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer);
  const [PO, setPO] = useState(invoice.po_number || '');
  const [date, setDate] = useState<DateRange | undefined>(parseDateRange());
  const [description, setDescription] = useState(invoice.description || '');
  const [comments, setComments] = useState(invoice.private_comments || '');
  const [vin, setVIN] = useState(invoice.vin || '');
  const [service, setService] = useState<(Service | undefined)[]>(formatInvoiceServices());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleServiceSelect = (index: number, selectedService: Service) => {
    setService(prev => {
      const newSelections = [...prev];
      newSelections[index] = {
        ...selectedService,
        unitprice: Number(selectedService.unitprice) || 0,
        istaxed: Boolean(selectedService.istaxed)
      };
      return newSelections;
    });
  };

  const addServiceSelection = () => {
    setService(prev => [...prev, undefined]);
  };

  const removeServiceSelection = (index: number) => {
    setService(prev => {
      if (prev.length > 1) {
        const updatedServices = prev.filter((_, i) => i !== index);
        return updatedServices;
      } else {
        return [undefined];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedCustomer) {
      setError('No customer selected');
      return;
    }
    const validServices = service.filter(s => s !== null);
    if (validServices.length === 0) {
      setError('At least one service must be selected');
      return;
    }

    try {
      const response = await fetch(`/api/data/invoices/${invoice.invoice_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selectedCustomer.customer_id,
          PO,
          description,
          comments,
          vin,
          startDate: date?.from?.toISOString(),
          dueDate: date?.to?.toISOString(),
          services: validServices,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server response:', data);
        throw new Error(data.details || data.error || 'Failed to update invoice');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard/invoices');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      console.error('Error details:', err);
      setError(errorMessage);
    }
  };

  const calculateTotals = React.useCallback(() => {
    const validServices = service.filter((s): s is Service => s !== undefined);
    
    return validServices.reduce((acc, service) => {
      const amount = Number(service.unitprice) || 0;
      const tax = Boolean(service.istaxed) ? amount * TAX_RATE : 0;
  
      return {
        subtotal: acc.subtotal + amount,
        taxTotal: acc.taxTotal + tax,
        total: acc.total + amount + tax
      };
    }, {
      subtotal: 0,
      taxTotal: 0,
      total: 0
    });
  }, [service]);

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`/api/data/invoices/${invoice.invoice_id}/pdf`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Create a blob from the PDF stream
      const blob = await response.blob();
      
      // Create a link element to download the PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };
  
  const handlePrint = async () => {
    try {
      const response = await fetch(`/api/data/invoices/${invoice.invoice_id}/pdf`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF for printing');
      }
      
      // Create a blob and open it in a new window
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open the PDF in a new window and print it
      const printWindow = window.open(url);
      
      if (printWindow) {
        printWindow.onload = function() {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error('Error printing invoice:', err);
      setError('Failed to print invoice');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Invoice #{invoice.invoice_id}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGeneratePDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-bold">Customer</label>
          <CustomerSelect onSelect={setSelectedCustomer} initialCustomer={initialCustomer} />
        </div>

        <div>
          <label className="block mb-1 font-bold">PO#</label>
          <input
            id="po"
            type="text"
            value={PO}
            onChange={(e) => setPO(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. PO/RO#123456"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">Date and Due Date</label>
          <DatePicker
            date={date}
            setDate={setDate}
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">Private Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Any private comments regarding this job?"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Enter job description here"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">VIN#</label>
          <input
            id="vin"
            type="text"
            value={vin}
            onChange={(e) => setVIN(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. 1HGCM82633A123456"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold">Services</label>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addServiceSelection}
            >
              <Plus size={15} />
            </Button>
          </div>
          <div className="space-y-4">
            {service.map((serviceItem, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <ServiceSelect
                    onSelect={(service) => handleServiceSelect(index, service)}
                    initialService={serviceItem}
                  />
                </div>
                {service.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      removeServiceSelection(index);
                    }}
                    className="mt-1"
                  >
                    <CircleX size={15} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>Invoice updated successfully!</AlertDescription>
          </Alert>
        )}
        
        <div className="mt-6 border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${calculateTotals().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8.75%):</span>
              <span>${calculateTotals().taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${calculateTotals().total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full">
          <Save className="mr-2" /> Update Invoice
        </Button>
      </form>
    </div>
  );
}