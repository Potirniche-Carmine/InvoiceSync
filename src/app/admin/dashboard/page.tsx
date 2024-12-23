'use client'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import Card from '@/app/components/card';
import {
  FaFileInvoiceDollar,
  FaQuoteRight,
  FaUserPlus,
  FaFileInvoice,
  FaFileAlt,
} from 'react-icons/fa';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      <div className="w-full max-w-4xl mt-10">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome to the Dashboard, {session?.user?.name}!
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            title="Create Invoice"
            icon={<FaFileInvoiceDollar className="text-red" />}
            redirectTo="/admin/dashboard/create-invoice"
          />
          <Card
            title="View Invoices"
            icon={<FaFileInvoice className="text-green-500" />}
            redirectTo="/admin/dashboard/invoices"
          />
          <Card
            title="Create Quote"
            icon={<FaQuoteRight className="text-purple-400" />}
            redirectTo="/admin/dashboard/create-quote"
          />
          <Card
            title="View Quotes"
            icon={<FaFileAlt className="text-yellow" />}
            redirectTo="/admin/dashboard/quotes"
          />
          <Card
            title="Add New Customer"
            icon={<FaUserPlus className="text-blue" />}
            redirectTo="/admin/dashboard/add-customer"
          />
        </div>
      </div>
    </div>
  );
};
