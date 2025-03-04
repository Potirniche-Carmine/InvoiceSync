'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerSelect from '@/app/components/customer_select';
import { Customer, InvoiceService, DetailedInvoice } from '@/app/lib/types';
import { Button } from '@/app/components/ui/button';
import { Plus, FilePlus, FileEdit } from "lucide-react";
import ServiceSelect from '@/app/components/services_select';
import { DatePicker } from '@/app/components/datepicker';
import { DateRange } from "react-day-picker";
import { Card, CardContent } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

const TAX_RATE = 0.0875;

interface CreateInvoiceFormProps {
  mode?: 'create' | 'edit';
  initialInvoice?: DetailedInvoice;
}

export default function CreateInvoiceForm({ 
  mode = 'create', 
  initialInvoice 
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialInvoice ? {
      customer_id: initialInvoice.customer_id,
      customer_name: initialInvoice.customer_name,
      customer_address: initialInvoice.customer_address
    } : null
  );
  const [PO, setPO] = useState(initialInvoice?.po_number || '');
  const [date, setDate] = useState<DateRange | undefined>(
    initialInvoice ? {
      from: initialInvoice.date ? new Date(initialInvoice.date) : undefined,
      to: initialInvoice.duedate ? new Date(initialInvoice.duedate) : undefined
    } : undefined
  );
  const [description, setDescription] = useState(initialInvoice?.description || '');
  const [comments, setComments] = useState(initialInvoice?.private_comments || '');
  const [vin, setVIN] = useState(initialInvoice?.vin || '');
  const [services, setServices] = useState<InvoiceService[]>(
    initialInvoice?.services || []
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a blank service slot if there are no services
  useEffect(() => {
    if (services.length === 0 && !initialInvoice) {
      addServiceSelection();
    }
  }, [services, initialInvoice]);

  const handleServiceSelect = (index: number, selectedService: InvoiceService) => {
    setServices(prev => {
      const updatedServices = [...prev];
      updatedServices[index] = selectedService;
      return updatedServices;
    });
  };

  const addServiceSelection = () => {
    setServices(prev => [...prev, { 
      service_id: 0,
      servicename: '',
      description: '',
      unitprice: 0,
      istaxed: false,
      quantity: 1,
      totalprice: 0
    }]);
  };

  const removeServiceSelection = (index: number) => {
    setServices(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    if (!selectedCustomer) {
      setError('No customer selected');
      setIsSubmitting(false);
      return;
    }

    const validServices = services.filter(s => 
      s.servicename && s.service_id && s.quantity > 0
    );

    if (validServices.length === 0) {
      setError('At least one valid service must be selected');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomer.customer_id,
        PO,
        description,
        comments,
        vin,
        startDate: date?.from?.toISOString(),
        dueDate: date?.to?.toISOString(),
        services: validServices,
      };

      // API endpoint and method depend on create/edit mode
      const endpoint = mode === 'edit' && initialInvoice
        ? `/api/data/invoices/${initialInvoice.invoice_id}`
        : '/api/data/invoices';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server response:', data);
        throw new Error(data.details || data.error || `Failed to ${mode} invoice`);
      }

      setSuccess(true);
      
      // Reset form if creating a new invoice
      if (mode === 'create') {
        setPO('');
        setDescription('');
        setSelectedCustomer(null);
        setComments('');
        setVIN('');
        setServices([]);
        setDate(undefined);
      }
      
      setTimeout(() => {
        router.push('/admin/dashboard/invoices');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${mode} invoice`;
      console.error('Error details:', err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    return services.reduce((acc, service) => {
      if (!service.servicename) return acc; // Skip empty services
      
      const quantity = service.quantity || 1;
      const unitPrice = service.unitprice || 0;
      const amount = quantity * unitPrice;
      const tax = service.istaxed ? amount * TAX_RATE : 0;
  
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
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block mb-1 font-medium">Customer</label>
              <CustomerSelect 
                onSelect={setSelectedCustomer} 
                initialCustomer={selectedCustomer}
                disabled={mode === 'edit'} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">PO#</label>
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
                <label className="block mb-1 font-medium">VIN#</label>
                <input
                  id="vin"
                  type="text"
                  value={vin}
                  onChange={(e) => setVIN(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. 1HGCM82633A123456"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">Invoice Date and Due Date</label>
              <DatePicker
                date={date}
                setDate={setDate}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block mb-1 font-medium">Private Comments (Not visible to customers)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Internal notes regarding this job"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Job Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter job description here (visible to customer)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-lg">Services</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addServiceSelection}
              >
                <Plus size={16} className="mr-1" /> Add Service
              </Button>
            </div>
            
            <div className="space-y-6">
              {services.map((service, index) => (
                <div key={index} className="border rounded-md p-4 relative">
                  <ServiceSelect
                    initialService={service.servicename ? service : undefined}
                    onSelect={(updatedService) => handleServiceSelect(index, updatedService)}
                    onRemove={() => removeServiceSelection(index)}
                    showRemoveButton={services.length > 1}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="border-red-600">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-600 bg-green-50">
            <AlertDescription className="text-green-700">
              {mode === 'edit' ? 'Invoice updated successfully!' : 'Invoice created successfully!'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${calculateTotals().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8.75%):</span>
              <span>${calculateTotals().taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${calculateTotals().total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>Processing...</>
          ) : mode === 'edit' ? (
            <><FileEdit className="mr-2" /> Update Invoice</>
          ) : (
            <><FilePlus className="mr-2" /> Create Invoice</>
          )}
        </Button>
      </form>
    </div>
  );
}