'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {UserRoundPlus } from "lucide-react";

export default function AddCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('/api/data/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, address }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMsg(errorData.error || 'Something went wrong');
      } else {
        router.push('/dashboard'); 
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred');
      console.error(err);
    } finally {
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add or update a customer</h1>
      {errorMsg && (
        <p className="text-red-600 mb-4">
          {errorMsg}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="customerName">
            Customer Name
          </label>
          <input
            id="customerName"
            type="text"
            className="border rounded w-full p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="customerAddress">
            Customer Address
          </label>
          <input
            id="customerAddress"
            type="text"
            className="border rounded w-full p-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St"
          />
        </div>
        <Button
        className="w-full">
          <UserRoundPlus/> Add/Update Customer
        </Button>
      </form>
    </div>
  );
}
