'use client';

import { useState } from 'react'
import CustomerSelect from '@/app/components/customer_select'
import { Customer } from '@/app/components/customer_select'
import { Button } from '@/app/components/ui/button'
import { Plus, CircleX } from "lucide-react"
import {FilePlus} from 'lucide-react'
import ServiceSelect from '@/app/components/services_select'
import { Service } from '@/app/components/services_select'
import { DatePicker } from '@/app/components/datepicker'

export default function CreateInvoicePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [PO, setPO] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [vin, setVIN] = useState('');
  const [service, setService] = useState<(Service | null)[]>([null]);  // Start with one service
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleServiceSelect = (index: number, service: Service) => {
    setService(prev => {
      const newSelections = [...prev];
      newSelections[index] = service;
      return newSelections;
    });
  };

  const addServiceSelection = () => {
    setService(prev => [...prev, null]);
  };

  const removeServiceSelection = (index: number) => {
    setService(prev => {
      // Only allow removal if there will be at least one service remaining
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

    if (!selectedCustomer) {
      setError('No customer selected');
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
          date: date?.toISOString(),
          services: service.filter(s => s !== null), // Only send non-null services
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      setSuccess(true);
      setPO('');
      setDescription('');
      setSelectedCustomer(null);
      setComments('');
      setVIN('');
      setService([null]); // Reset to one empty service
    } catch (err) {
      setError('Failed to create invoice');
      console.error(err);
    }
  };

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
          <label className="block mb-1 font-bold">Date</label>
          <DatePicker 
            date = {date}
            setDate = {setDate}/>
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
                    onClick={() => removeServiceSelection(index)}
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

        <Button
          type="submit"
          className="w-full">
          <FilePlus/> Create Invoice
        </Button>
      </form>
    </div>
  );
}