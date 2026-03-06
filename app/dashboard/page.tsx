import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.usertype === "admin";

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Main Dashboard</h1>
            <p className="mt-1 text-gray-500 font-medium italic">Welcome back, {session?.user?.name || "guest"}.</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${isAdmin ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
            {isAdmin ? 'Admin Portal' : 'User Portal'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/user/yaka" className="group p-8 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
             <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
             <div className="text-white font-black text-xl tracking-tight">Yaka Usage Calculator</div>
             <div className="text-green-100 text-sm mt-1 font-medium opacity-80">Estimate & track power consumption</div>
          </Link>

          <Link href="/user/update" className="group p-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
             <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👤</div>
             <div className="text-white font-black text-xl tracking-tight">Update Profile</div>
             <div className="text-blue-100 text-sm mt-1 font-medium opacity-80">Edit your details & preferences</div>
          </Link>

          <Link href="/user/cost" className="group p-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
             <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
             <div className="text-white font-black text-xl tracking-tight">Cost Breakdown</div>
             <div className="text-indigo-100 text-sm mt-1 font-medium opacity-80">View unit tariffs & estimated bill</div>
          </Link>

          {isAdmin && (
            <Link href="/admin/dashboard" className="group p-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
               <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🛡️</div>
               <div className="text-white font-black text-xl tracking-tight">Admin Dashboard</div>
               <div className="text-amber-100 text-sm mt-1 font-medium opacity-80">Manage all registered users</div>
            </Link>
          )}
        </div>

        <div className="mt-12 text-center">
            <Link href="/api/auth/signout" className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-red-200 pb-1">Sign Out & Logout</Link>
        </div>
      </div>
    </div>
  );
}
