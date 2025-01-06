'use client';

import { useState } from 'react';
import CustomerSelect from '@/app/components/customer_select';
import { Customer } from '@/app/components/customer_select';
import Button from '@/app/components/button';


export default function CreateInvoicePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [PO, setPO] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
          <label className="block mb-1">Customer</label>
          <CustomerSelect onSelect={setSelectedCustomer} />
        </div>

        <div>
          <label className="block mb-1">PO#</label>
          <input
            id ="po"
            type="text"
            value={PO}
            onChange={(e) => setPO(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. PO/RO#123456"
          />
        </div>

        <div>
          <label className="block mb-1">Private Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Any private comments regarding this job?"
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Enter job description here"
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {success && (
          <p className="text-green-500">Invoice created successfully!</p>
        )}

        <Button
        type="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50">
          Create Invoice
        </Button>
      </form>
    </div>
  );
}