"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Home, ShieldCheck, Users, AlertTriangle, FileText, Sparkles, Gauge } from "lucide-react";

type Overview = {
  totalUsers: number;
  usersWithAppliances: number;
  avgAppliancesPerUser: number;
  totalAppliances: number;
  openComplaints: number;
  totalComplaints: number;
  newUsers7d: number;
  newUsers30d: number;
  topAppliances: Array<{ name: string; count: number; avgPower: number }>;
  unreadAdminNotifications: number;
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        const res = await fetch("/api/admin/overview");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setOverview(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="bg-amber-500 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Admin Hub</span>
        </Link>

        <nav className="space-y-2 flex-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-amber-50 text-amber-800"
          >
            <ShieldCheck className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link
            href="/admin/complaints"
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <AlertTriangle className="w-5 h-5" /> Complaints
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm"
          >
            <Home className="w-5 h-5" /> Switch to User View
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 lg:p-10 space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 md:p-10 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-white/70">
                <ShieldCheck className="w-4 h-4 text-amber-300" /> Admin Command Center
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                Operational pulse for <span className="text-amber-300">OP Energy</span>.
              </h1>
              <p className="text-sm md:text-base text-white/70 leading-relaxed">
                Track adoption, appliance activity, and support workload. Prioritize complaints and keep the platform healthy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/complaints"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-slate-900 px-4 py-2 text-sm font-black hover:bg-amber-300"
                >
                  <AlertTriangle className="w-4 h-4" /> Review Complaints
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
                >
                  <Users className="w-4 h-4" /> Manage Users
                </Link>
              </div>
            </div>

            <div className="w-full md:w-[260px] rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60 font-black">
                Live Status <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="mt-4 space-y-3">
                <StatusRow label="Platform" value="Stable" tone="text-emerald-300" />
                <StatusRow label="Alerts" value={loading ? "..." : String(overview?.unreadAdminNotifications ?? 0)} tone="text-amber-300" />
                <StatusRow label="Complaints" value={loading ? "..." : String(overview?.openComplaints ?? 0)} tone="text-rose-300" />
              </div>
              <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/70">
                Updated a few seconds ago.
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={loading ? "..." : String(overview?.totalUsers ?? 0)} accent="bg-blue-600" />
          <StatCard label="New Users (7d)" value={loading ? "..." : String(overview?.newUsers7d ?? 0)} accent="bg-indigo-600" />
          <StatCard label="New Users (30d)" value={loading ? "..." : String(overview?.newUsers30d ?? 0)} accent="bg-violet-600" />
          <StatCard label="Users With Appliances" value={loading ? "..." : String(overview?.usersWithAppliances ?? 0)} accent="bg-emerald-600" />
          <StatCard label="Avg Appliances / User" value={loading ? "..." : String(overview?.avgAppliancesPerUser ?? 0)} accent="bg-teal-600" />
          <StatCard label="Total Appliances" value={loading ? "..." : String(overview?.totalAppliances ?? 0)} accent="bg-sky-600" />
          <StatCard label="Open Complaints" value={loading ? "..." : String(overview?.openComplaints ?? 0)} accent="bg-rose-600" />
          <StatCard label="All Complaints" value={loading ? "..." : String(overview?.totalComplaints ?? 0)} accent="bg-amber-600" />
          <StatCard label="Unread Admin Alerts" value={loading ? "..." : String(overview?.unreadAdminNotifications ?? 0)} accent="bg-slate-900" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminCard
            title="Manage Users"
            subtitle="Review accounts and saved appliance profiles."
            href="/admin/users"
            icon={<Users className="w-6 h-6" />}
            style="from-blue-600 to-blue-700"
          />
          <AdminCard
            title="Complaints Inbox"
            subtitle="Review and resolve user complaints."
            href="/admin/complaints"
            icon={<AlertTriangle className="w-6 h-6" />}
            style="from-rose-600 to-rose-700"
          />
          <AdminCard
            title="Switch To User View"
            subtitle="Return to standard dashboard modules."
            href="/dashboard"
            icon={<Home className="w-6 h-6" />}
            style="from-slate-700 to-slate-800"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Top Appliances (All Users)</h2>
                <p className="text-sm text-slate-600 mt-2">Identify the most common appliances to guide education and tariffs.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Aggregated insights
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(overview?.topAppliances || []).length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No appliance data yet. Encourage users to save appliance lists.
                </div>
              ) : (
                overview?.topAppliances?.map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-900 capitalize">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Saved by {item.count} users · Avg {item.avgPower}W</p>
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, item.count * 12)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Operational Notes</h2>
              <Gauge className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Keep appliance data up to date so tariff planning remains accurate for households.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Review complaints within 24 hours to maintain user trust.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Encourage users to save appliance lists to improve analytics quality.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-1 w-full ${accent}`} />
      <p className="text-xs uppercase tracking-wider font-black text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function AdminCard({
  title,
  subtitle,
  href,
  icon,
  style,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  style: string;
}) {
  return (
    <Link href={href} className={`group rounded-2xl bg-gradient-to-br ${style} p-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-white`}>
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">{icon}</div>
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <p className="text-sm text-white/80 mt-1 font-medium">{subtitle}</p>
    </Link>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className={`font-black ${tone}`}>{value}</span>
    </div>
  );
}
