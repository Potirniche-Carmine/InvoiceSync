'use client';

import { useState } from 'react';
import CustomerSelect from '@/app/components/customer_select';
import { Customer } from '@/app/components/customer_select';


export default function CreateInvoicePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedCustomer) {
      setError('Please select a customer');
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
          amount: parseFloat(amount),
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      setSuccess(true);
      setAmount('');
      setDescription('');
      setSelectedCustomer(null);
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
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            required
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {success && (
          <p className="text-green-500">Invoice created successfully!</p>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Invoice
        </button>
      </form>
    </div>
  );
}