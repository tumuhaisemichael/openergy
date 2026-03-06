"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      setError("Error connecting to the API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading user data...</div>;
  if (error) return <div className="p-12 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-8 flex justify-between items-center text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Registered Users</h1>
            <p className="mt-1 text-blue-100 font-medium">View user details and power consumption profiles</p>
          </div>
          <Link href="/admin/dashboard" className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2.5 rounded-xl transition-all text-sm font-bold border border-white/30">
            &larr; Dashboard
          </Link>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-6">
            {users.length === 0 ? (
              <div className="py-20 text-center text-gray-400 italic bg-gray-50 rounded-xl border-2 border-dashed">No registered users found</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="border border-gray-100 rounded-2xl p-6 bg-white hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">✉️ {user.email}</span>
                        <span className="flex items-center gap-1">📱 {user.phone || "No phone added"}</span>
                        <span className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-gray-300">ID: {user.id}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold">
                      {user.savedAppliances?.length || 0} Appliances Saved
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {user.savedAppliances?.map((app: any) => (
                      <div key={app.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
                        <div className="font-bold text-gray-800 mb-1">{app.name}</div>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-semibold text-gray-400 uppercase">{app.power}W</span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg">{app.hoursPerDay} Hrs/Day</span>
                        </div>
                      </div>
                    ))}
                    {(!user.savedAppliances || user.savedAppliances.length === 0) && (
                      <div className="col-span-full py-4 text-center text-gray-400 text-sm italic">User hasn't saved any appliances yet.</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
