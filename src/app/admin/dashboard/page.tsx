import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

const DashboardPage: React.FC = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin"); // Redirect to login page if not authenticated
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl">Welcome to the Dashboard, {session?.user?.name}!</h1>
    </div>
  );
};

export default DashboardPage;
