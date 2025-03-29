'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerSelect from '@/components/customer_select';
import { Customer, InvoiceService, DetailedInvoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, FilePlus, FileEdit } from "lucide-react";
import ServiceSelect from '@/components/services_select';
import { DatePicker } from '@/components/datepicker';
import { DateRange } from "react-day-picker";
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VinDecoder from '@/components/vinDecoder';
import { TAX_RATE, TAX_RATE_DISPLAY } from "@/lib/constants";
import { useSearchParams } from 'next/navigation';
interface CreateInvoiceFormProps {
  mode?: 'create' | 'edit';
  initialInvoice?: DetailedInvoice;
}


export default function CreateInvoiceForm({
  mode = 'create',
  initialInvoice
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuoteId = searchParams.get('from_quote');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialInvoice ? {
      customer_id: initialInvoice.customer_id,
      customer_name: initialInvoice.customer_name,
      customer_address: initialInvoice.customer_address
    } : null
  );
  const [PO, setPO] = useState(initialInvoice?.po_number || '');
  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (!initialInvoice || (!initialInvoice.date && !initialInvoice.duedate)) {
      return undefined;
    }
    
    return {
      from: initialInvoice.date ? adjustDateForTimezone(initialInvoice.date) : undefined,
      to: initialInvoice.duedate ? adjustDateForTimezone(initialInvoice.duedate) : undefined
    };
  });
  
  function adjustDateForTimezone(dateString: string) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date(); // Fallback
    
    return new Date(
      parseInt(parts[0]), 
      parseInt(parts[1]) - 1, 
      parseInt(parts[2])
    );
  }
  const [description, setDescription] = useState(initialInvoice?.description || '');
  const [comments, setComments] = useState(initialInvoice?.private_comments || '');
  const [vin, setVIN] = useState(initialInvoice?.vin || '');
  const [services, setServices] = useState<InvoiceService[]>(
    initialInvoice?.services?.map(service => ({
      ...service,
      istaxed: Boolean(service.istaxed)
    })) || []
  );


  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const vinDecoderRef = React.useRef<{
    decodeVin: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!fromQuoteId) return;

      try {
        const response = await fetch(`/api/data/quotes/get-for-invoice?quoteId=${fromQuoteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quote data');
        }

        const data = await response.json();
        const quote = data.quote;

        setSelectedCustomer({
          customer_id: quote.customer_id,
          customer_name: quote.customer_name,
          customer_address: quote.customer_address
        });

        setPO(quote.po_number || '');
        setDescription(quote.description || '');
        setComments(quote.private_comments || '');
        setVIN(quote.vin || '');

        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 30);

        setDate({
          from: today,
          to: dueDate
        });

        // Set services
        if (quote.services && quote.services.length > 0) {
          setServices(quote.services);
        }
      } catch (error) {
        console.error('Error fetching quote data:', error);
        setError('Failed to load quote data. Please try again.');
      }
    };

    fetchQuoteData();
  }, [fromQuoteId]);

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

  const handleVehicleInfoAdded = (vehicleInfo: string) => {
    setDescription(prev => {
      if (prev.includes(`Last 8#: ${vin.slice(-8)}`)) {
        const pattern = new RegExp(`------------------------------[\\s\\S]*?Last 8#: ${vin.slice(-8)}`, 'g');
        return prev.replace(pattern, vehicleInfo.trim());
      }
      if (!prev) {
        return vehicleInfo.trim();
      } else if (prev.endsWith('\n')) {
        return prev + vehicleInfo.trim();
      } else {
        return prev + vehicleInfo;
      }
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

    const formatDateForSubmission = (date: Date | undefined) => {
      if (!date) return undefined;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

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
        startDate: date?.from ? formatDateForSubmission(date.from) : undefined,
        dueDate: date?.to ? formatDateForSubmission(date.to) : undefined,
        services: validServices,
      };

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
        router.push('/dashboard/invoices?refresh=true');
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
      if (!service.servicename) return acc;

      const quantity = service.quantity || 1;
      const unitPrice = service.unitprice || 0;
      const amount = parseFloat((quantity * unitPrice).toFixed(2));
      const tax = service.istaxed ? parseFloat((amount * TAX_RATE).toFixed(2)) : 0;

      return {
        subtotal: parseFloat((acc.subtotal + amount).toFixed(2)),
        taxTotal: parseFloat((acc.taxTotal + tax).toFixed(2)),
        total: parseFloat((acc.total + amount + tax).toFixed(2))
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
      {fromQuoteId && (
        <Alert className="mb-6">
          <AlertDescription>
            Creating invoice from Quote #{fromQuoteId}
          </AlertDescription>
        </Alert>
      )}

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

              <div className="space-y-1">
                <label className="block mb-1 font-medium">VIN#</label>
                <input
                  id="vin"
                  type="text"
                  value={vin}
                  onChange={(e) => setVIN(e.target.value.toUpperCase())}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. 1HGCM82633A123456"
                  maxLength={17}
                />
                <VinDecoder
                  ref={vinDecoderRef}
                  vin={vin}
                  onVehicleInfoAdded={handleVehicleInfoAdded}
                  disabled={isSubmitting}
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
                rows={3}
                placeholder="Internal notes regarding this job"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Comments: </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter comments here (visible to customer)"
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
              <span>Tax ({TAX_RATE_DISPLAY}):</span>
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