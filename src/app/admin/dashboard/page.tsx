import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import Card from '@/app/components/card';
import {
  FilePlus,
  BookOpen,
  FilePlus2,
  UserRoundPlus,

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
            redirectTo="/admin/dashboard/create-invoice"
          />
          <Card
            title="View Invoices"
            icon={<BookOpen color="#edff00"/>}
            redirectTo="/admin/dashboard/invoices"
          />
          <Card
            title="Create Quote"
            icon={<FilePlus2 color="#ff0000"/>}
            redirectTo="/admin/dashboard/create-quote"
          />
          <Card
            title="View Quotes"
            icon={<BookOpen color="#ff8a00"/>}
            redirectTo="/admin/dashboard/quotes"
          />
          <Card
            title="Add New Customer"
            icon={<UserRoundPlus color="#00ff11 "/>}
            redirectTo="/admin/dashboard/add-customer"
          />
        </div>
      </div>
    </div>
  );
};
