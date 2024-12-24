'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/button';

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface ServiceRow {
  serviceName: string;
  description: string;
  unitPrice: string; // keep as string for input
  quantity: string;  // keep as string for input
  isTaxed: boolean;
}

export default function AddInvoicePage() {
  const router = useRouter();

  // State for the dropdown of customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // State for services
  const [services, setServices] = useState<ServiceRow[]>(() => [
    { serviceName: '', description: '', unitPrice: '', quantity: '', isTaxed: false },
    { serviceName: '', description: '', unitPrice: '', quantity: '', isTaxed: false },
  ]);

  const [errorMsg, setErrorMsg] = useState('');

  // Fetch customers from the database
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch('/api/customers'); // or wherever your GET route is
        if (!res.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    }
    fetchCustomers();
  }, []);

  // Add another service row
  function handleAddService() {
    setServices((prev) => [
      ...prev,
      {
        serviceName: '',
        description: '',
        unitPrice: '',
        quantity: '',
        isTaxed: false,
      },
    ]);
  }

  // Update service row
  function handleServiceChange(
    index: number,
    field: keyof ServiceRow,
    value: string | boolean
  ) {
    setServices((prev) =>
      prev.map((svc, idx) => {
        if (idx !== index) return svc;
        return { ...svc, [field]: value };
      })
    );
  }

  // Compute total on the client side
  const taxRate = 0.08315; // 8.315%
  let computedTotal = 0;
  for (const svc of services) {
    const priceNum = parseFloat(svc.unitPrice) || 0;
    const qtyNum = parseFloat(svc.quantity) || 0;
    let line = priceNum * qtyNum;
    if (svc.isTaxed) {
      line += line * taxRate;
    }
    computedTotal += line;
  }

  // Handle form submission
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');

    // Basic validation
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    // Convert strings to numbers for the final POST body
    const servicesForApi = services.map((svc) => ({
      serviceName: svc.serviceName.trim(),
      description: svc.description.trim(),
      unitPrice: parseFloat(svc.unitPrice) || 0,
      quantity: parseFloat(svc.quantity) || 0,
      isTaxed: svc.isTaxed,
    }));

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(selectedCustomerId, 10),
          services: servicesForApi,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMsg(errorData.error || 'Something went wrong');
      } else {
        // If successful, you can redirect or show a success message
        const data = await res.json();
        console.log('Invoice created with ID:', data.invoiceId);
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred');
      console.error(err);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create a New Invoice</h1>

      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Dropdown */}
        <div>
          <label className="block font-semibold mb-1" htmlFor="customer-select">
            Select Customer
          </label>
          <select
            id="customer-select"
            className="border rounded w-full p-2"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">-- Choose a Customer --</option>
            {customers.map((cust) => (
              <option
                key={cust.customer_id}
                value={cust.customer_id}
              >
                {cust.customer_name}
              </option>
            ))}
          </select>
        </div>

        {/* Services Section */}
        <div className="space-y-6">
          {services.map((svc, index) => (
            <div
              key={index}
              className="p-4 border rounded space-y-2 bg-gray-50"
            >
              <h3 className="font-semibold">Service {index + 1}</h3>

              <div>
                <label className="block mb-1">Service Name</label>
                <input
                  className="border rounded w-full p-2"
                  type="text"
                  value={svc.serviceName}
                  onChange={(e) =>
                    handleServiceChange(index, 'serviceName', e.target.value)
                  }
                  placeholder="e.g. Web Design"
                />
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <input
                  className="border rounded w-full p-2"
                  type="text"
                  value={svc.description}
                  onChange={(e) =>
                    handleServiceChange(index, 'description', e.target.value)
                  }
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block mb-1">Unit Price</label>
                <input
                  className="border rounded w-full p-2"
                  type="number"
                  value={svc.unitPrice}
                  onChange={(e) =>
                    handleServiceChange(index, 'unitPrice', e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block mb-1">Quantity</label>
                <input
                  className="border rounded w-full p-2"
                  type="number"
                  value={svc.quantity}
                  onChange={(e) =>
                    handleServiceChange(index, 'quantity', e.target.value)
                  }
                  placeholder="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label>Taxed?</label>
                <input
                  type="checkbox"
                  checked={svc.isTaxed}
                  onChange={(e) =>
                    handleServiceChange(index, 'isTaxed', e.target.checked)
                  }
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            className="bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
            onClick={handleAddService}
          >
            + Add Another Service
          </Button>
        </div>

        {/* Show computed total on the client */}
        <div>
          <label className="block font-semibold mb-1">Invoice Total:</label>
          <div className="text-lg font-bold">
            {computedTotal}
          </div>
        </div>

        <Button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Create Invoice
        </Button>
      </form>
    </div>
  );
}
