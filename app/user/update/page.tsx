"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type HistoryEntry = {
  id: string;
  createdAt: string;
  days: number;
  totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
};

type SavedAppliance = { name: string; power: number; hoursPerDay: number };

export default function UserUpdate() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const historyStorageKey = `openergy:yaka:history:${userKey}`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedAppliances, setSavedAppliances] = useState<SavedAppliance[]>([]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const res = await fetch("/api/auth/profile");
      if (res.ok && active) {
        const data = await res.json();
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
      }

      try {
        const appRes = await fetch("/api/user/appliances/save");
        const appData = await appRes.json();
        if (active) setSavedAppliances(Array.isArray(appData.appliances) ? appData.appliances : []);
      } catch {
        if (active) setSavedAppliances([]);
      }

      if (typeof window !== "undefined" && active) {
        const raw = window.localStorage.getItem(historyStorageKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as HistoryEntry[];
            setHistory(Array.isArray(parsed) ? parsed : []);
          } catch {
            setHistory([]);
          }
        }
      }

      if (active) setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [historyStorageKey]);

  const stats = useMemo(() => {
    const totalEntries = history.length;
    const totalSpend = history.reduce((sum, item) => sum + Number(item.totals?.estimatedCost || 0), 0);
    const totalUnits = history.reduce((sum, item) => sum + Number(item.totals?.periodKwh || 0), 0);

    return {
      totalEntries,
      totalSpend,
      totalUnits,
      applianceCount: savedAppliances.length,
    };
  }, [history, savedAppliances]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (res.ok) {
        setMessage("Profile updated successfully.");
      } else {
        const d = await res.json();
        setMessage(d.error || "Failed to update profile.");
      }
    } catch {
      setMessage("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow">
                {(name || "U")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">User Profile</p>
                <h1 className="page-title mt-1">{name || "Energy User"}</h1>
                <p className="page-subtitle mt-1">Manage your account, track usage footprint, and keep data up to date.</p>
              </div>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Saved Appliances" value={String(stats.applianceCount)} />
          <StatCard label="Calculator Entries" value={String(stats.totalEntries)} />
          <StatCard label="Tracked Units" value={`${stats.totalUnits.toFixed(1)} kWh`} />
          <StatCard label="Tracked Spend" value={`UGX ${Math.round(stats.totalSpend).toLocaleString()}`} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-6 xl:col-span-2">
            <h2 className="text-lg font-black text-slate-900 mb-3">Account Details</h2>

            {message && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Full Name
                <input
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Phone Number
                <input
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <button
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white font-bold p-3 rounded-xl transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-black text-slate-900">Quick Insights</h2>
            <p className="text-sm text-slate-700">Profile completeness improves planning outputs across bill breakdown, AI advisor, and money planner.</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-black">Email</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{session?.user?.email || "Not available"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-black">Account Type</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{session?.user?.usertype || "user"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-black">Latest Activity</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {history[0] ? new Date(history[0].createdAt).toLocaleString() : "No calculator activity yet"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-black">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
