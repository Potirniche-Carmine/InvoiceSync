import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Card from '@/components/card';
import {
  FilePlus,
  BookOpen,
  FilePlus2,
  UserRoundPlus,
  BarChart3,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-4xl mt-10">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome to the Dashboard, {session?.user?.name}!
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            title="Create Invoice"
            icon={<FilePlus color="#004aff"/>}
            redirectTo="/dashboard/create-invoice"
          />
          <Card
            title="View Invoices"
            icon={<BookOpen color="#aa00ff"/>}
            redirectTo="/dashboard/invoices"
          />
          <Card
            title="Create Quote"
            icon={<FilePlus2 color="#ff0000"/>}
            redirectTo="/dashboard/create-quote"
          />
          <Card
            title="View Quotes"
            icon={<BookOpen color="#ff8c00"/>}
            redirectTo="/dashboard/quotes"
          />
          <Card
            title="Add New Customer"
            icon={<UserRoundPlus color="#00ff11"/>}
            redirectTo="/dashboard/add-customer"
          />
          <Card
            title="Payments/Taxes"
            icon={<BarChart3 color="#00c8ff"/>}
            redirectTo="/dashboard/financial-summary"
          />
        </div>
      </div>
    </div>
  );
}