import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Management Hub</h1>
          <p className="mt-1 text-gray-500 font-medium italic">Oversee registered users and their power consumption data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users" className="group p-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
             <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👥</div>
             <div className="text-white font-black text-xl tracking-tight">Manage All Users</div>
             <div className="text-blue-100 text-sm mt-1 font-medium opacity-80">View profiles and appliance configurations</div>
          </Link>

          <Link href="/dashboard" className="group p-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-lg">
             <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏠</div>
             <div className="text-white font-black text-xl tracking-tight">User Dashboard</div>
             <div className="text-gray-100 text-sm mt-1 font-medium opacity-80">Switch to regular user view</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
