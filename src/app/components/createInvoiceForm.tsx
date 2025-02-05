'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerSelect from '@/app/components/customer_select'
import { Customer } from '@/app/components/customer_select'
import { Button } from '@/app/components/ui/button'
import { Plus, CircleX } from "lucide-react"
import { FilePlus } from 'lucide-react'
import ServiceSelect from '@/app/components/services_select'
import { Service } from '@/app/components/services_select'
import { DatePicker } from '@/app/components/datepicker'
import { DateRange } from "react-day-picker"
const TAX_RATE = 0.0875

export default function CreateInvoiceForm() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [PO, setPO] = useState('');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [vin, setVIN] = useState('');
  const [service, setService] = useState<(Service | null)[]>([null]);  // Start with one service
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
    setService(prev => [...prev, null]);
  };

  const removeServiceSelection = (index: number) => {
    setService(prev => {
      if (prev.length > 1) {
        const updatedServices = prev.filter((_, i) => i !== index);
        return updatedServices;
      } else {
        return [null];
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
      const response = await fetch('/api/invoices', {
        method: 'POST',
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
        throw new Error(data.details || data.error || 'Failed to create invoice');
      }

      setSuccess(true);
      setPO('');
      setDescription('');
      setSelectedCustomer(null);
      setComments('');
      setVIN('');
      setService([null]);
      setDate(undefined);
      setTimeout(() => {
        router.push('/admin/dashboard/invoices');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      console.error('Error details:', err);
      setError(errorMessage);
    }
  };


  const calculateTotals = React.useCallback(() => {
    const validServices = service.filter((s): s is Service => s !== null);
    
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-bold">Customer</label>
          <CustomerSelect onSelect={setSelectedCustomer} />
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

        {error && <p className="text-red-500">{error}</p>}
        {success && (
          <p className="text-green-500">Invoice created successfully!</p>
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
          <FilePlus /> Create Invoice
        </Button>
      </form>
    </div>
  );
}