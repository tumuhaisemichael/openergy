"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal, Users } from "lucide-react";

type SavedAppliance = {
  id: number;
  name: string;
  power: number;
  hoursPerDay: number;
};

type AppUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt?: string;
  savedAppliances?: SavedAppliance[];
};

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyWithAppliances, setOnlyWithAppliances] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [expandedUsers, setExpandedUsers] = useState<number[]>([]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError("Failed to fetch users.");
      }
    } catch {
      setError("Error connecting to the API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const usersWithAppliances = users.filter((u) => (u.savedAppliances?.length || 0) > 0).length;
    const totalAppliances = users.reduce((sum, u) => sum + (u.savedAppliances?.length || 0), 0);
    const averageAppliances = totalUsers > 0 ? (totalAppliances / totalUsers).toFixed(1) : "0.0";

    return { totalUsers, usersWithAppliances, averageAppliances };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    let filtered = users.filter((u) => {
      if (onlyWithAppliances && (u.savedAppliances?.length || 0) === 0) return false;
      if (!searchTerm) return true;
      return u.name.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm);
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);

      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [users, search, onlyWithAppliances, sortBy]);

  function toggleExpanded(id: number) {
    setExpandedUsers((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8 text-red-700 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-7xl space-y-5">
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">Admin</p>
              <h1 className="page-title mt-1">Registered Users</h1>
              <p className="page-subtitle mt-2">Review account details and saved appliance plans.</p>
            </div>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <SummaryCard label="Total Users" value={`${summary.totalUsers}`} />
            <SummaryCard label="Users With Appliances" value={`${summary.usersWithAppliances}`} />
            <SummaryCard label="Avg Appliances / User" value={summary.averageAppliances} />
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Search
              <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or email"
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Sort By
              <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")} className="bg-transparent outline-none w-full text-sm">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </label>

            <label className="text-sm font-semibold text-slate-700 flex items-end">
              <span className="mt-2 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full">
                <input
                  type="checkbox"
                  checked={onlyWithAppliances}
                  onChange={(e) => setOnlyWithAppliances(e.target.checked)}
                  className="accent-blue-600"
                />
                Only users with saved appliances
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="card p-8 text-slate-500 italic text-center">No users match the current filters.</div>
          ) : (
            filteredUsers.map((user) => {
              const appliances = user.savedAppliances || [];
              const isExpanded = expandedUsers.includes(user.id);

              return (
                <div key={user.id} className="card p-5">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                      <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-1">Phone: {user.phone || "No phone added"}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider">
                        <Users className="w-3 h-3" /> {appliances.length} appliances
                      </div>
                      <button
                        onClick={() => toggleExpanded(user.id)}
                        className="block mt-2 text-sm font-bold text-slate-700 hover:text-slate-900"
                      >
                        {isExpanded ? "Hide details" : "Show details"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {appliances.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 italic">
                          User has not saved any appliances yet.
                        </div>
                      ) : (
                        appliances.map((app) => (
                          <div key={app.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="font-bold text-slate-800 text-sm">{app.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{app.power}W</p>
                            <p className="text-xs font-black text-blue-700 mt-2">{app.hoursPerDay} hrs/day</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider font-black text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}
