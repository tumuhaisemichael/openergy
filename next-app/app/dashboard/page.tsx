import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2">Welcome {session?.user?.name || "guest"}.</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Link href="/user/update" className="p-4 bg-green-100 rounded">Update Profile</Link>
          <Link href="/user/yaka" className="p-4 bg-green-100 rounded">Yaka Usage Calculator</Link>
          <Link href="/user/cost" className="p-4 bg-green-100 rounded">Cost</Link>
          <Link href="/admin/dashboard" className="p-4 bg-green-100 rounded">Admin Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
