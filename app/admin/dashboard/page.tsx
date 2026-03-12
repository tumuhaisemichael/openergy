"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Home, ShieldCheck, Users, AlertTriangle, FileText } from "lucide-react";

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
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-100 text-amber-700 px-3 py-2 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Admin Portal
          </div>
          <h1 className="page-title mt-3">Admin Management Hub</h1>
          <p className="page-subtitle mt-2">Monitor user growth, appliance activity, and incoming complaints.</p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={loading ? "..." : String(overview?.totalUsers ?? 0)} />
          <StatCard label="New Users (7d)" value={loading ? "..." : String(overview?.newUsers7d ?? 0)} />
          <StatCard label="New Users (30d)" value={loading ? "..." : String(overview?.newUsers30d ?? 0)} />
          <StatCard label="Users With Appliances" value={loading ? "..." : String(overview?.usersWithAppliances ?? 0)} />
          <StatCard label="Avg Appliances / User" value={loading ? "..." : String(overview?.avgAppliancesPerUser ?? 0)} />
          <StatCard label="Total Appliances" value={loading ? "..." : String(overview?.totalAppliances ?? 0)} />
          <StatCard label="Open Complaints" value={loading ? "..." : String(overview?.openComplaints ?? 0)} />
          <StatCard label="All Complaints" value={loading ? "..." : String(overview?.totalComplaints ?? 0)} />
          <StatCard label="Unread Admin Alerts" value={loading ? "..." : String(overview?.unreadAdminNotifications ?? 0)} />
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

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Top Appliances (All Users)</h2>
              <p className="text-sm text-slate-600 mt-2">Identify the most common appliances to guide education and tariffs.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Aggregated insights
              <FileText className="w-4 h-4 text-rose-600" /> Complaint flow enabled
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
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
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
