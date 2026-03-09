"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Calculator,
  Cpu,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
  User,
  Wallet,
  Zap,
} from "lucide-react";

type SavedAppliance = { name: string; power: number; hoursPerDay?: number };
type HistoryEntry = {
  id: string;
  createdAt: string;
  days: number;
  tariff: number;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
  totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
};

const DEFAULT_TARIFF = 805;

const modules = [
  {
    title: "Usage Calculator",
    desc: "Estimate units and projected spend",
    href: "/user/yaka",
    icon: Calculator,
    color: "bg-blue-600",
  },
  {
    title: "Cost Breakdown",
    desc: "Tariff assumptions and bill model",
    href: "/user/cost",
    icon: Wallet,
    color: "bg-indigo-600",
  },
  {
    title: "Appliances",
    desc: "View and manage saved appliances",
    href: "/user/appliances",
    icon: ListChecks,
    color: "bg-amber-600",
  },
  {
    title: "Connect Devices",
    desc: "Add wireless and remote devices",
    href: "/user/connect",
    icon: Cpu,
    color: "bg-teal-600",
  },
  {
    title: "Power Profile",
    desc: "Edit your account and appliance data",
    href: "/user/update",
    icon: User,
    color: "bg-emerald-600",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.usertype === "admin";
  const userId = session?.user?.id || "anonymous";

  const [savedAppliances, setSavedAppliances] = useState<SavedAppliance[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setStatsLoading(true);

      try {
        const res = await fetch("/api/user/appliances/save");
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setSavedAppliances(Array.isArray(data.appliances) ? data.appliances : []);
          }
        }
      } catch {
        if (active) setSavedAppliances([]);
      }

      if (typeof window !== "undefined") {
        const historyKey = `openergy:yaka:history:${userId}`;
        const raw = window.localStorage.getItem(historyKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as HistoryEntry[];
            if (active) setHistory(Array.isArray(parsed) ? parsed : []);
          } catch {
            if (active) setHistory([]);
          }
        } else if (active) {
          setHistory([]);
        }
      }

      if (active) setStatsLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [userId]);

  const sampleStats = useMemo(() => {
    const latestHistory = history[0];

    if (latestHistory) {
      const monthlyUnits = latestHistory.totals.dailyKwh * 30;
      return [
        { label: "Estimated Monthly Units", value: monthlyUnits.toFixed(1) },
        {
          label: "Average Daily Spend",
          value: `UGX ${Math.round(latestHistory.totals.dailyKwh * latestHistory.tariff).toLocaleString()}`,
        },
        { label: "Saved Appliance Entries", value: String(savedAppliances.length) },
      ];
    }

    const fallbackDailyKwh = savedAppliances.reduce((sum, app) => {
      const hours = Math.max(0, Math.min(24, Number(app.hoursPerDay || 0)));
      return sum + (Number(app.power) * hours) / 1000;
    }, 0);

    return [
      { label: "Estimated Monthly Units", value: (fallbackDailyKwh * 30).toFixed(1) },
      { label: "Average Daily Spend", value: `UGX ${Math.round(fallbackDailyKwh * DEFAULT_TARIFF).toLocaleString()}` },
      { label: "Saved Appliance Entries", value: String(savedAppliances.length) },
    ];
  }, [history, savedAppliances]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 uppercase">OP Energy</span>
        </Link>

        <nav className="space-y-2 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/user/yaka" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm">
            <Calculator className="w-5 h-5" /> Calculator
          </Link>
          <Link href="/user/cost" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm">
            <Wallet className="w-5 h-5" /> Bill Breakdown
          </Link>
          <Link href="/user/update" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm">
            <User className="w-5 h-5" /> Profile
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-2">
          {isAdmin && (
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-700 bg-amber-50 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" /> Admin Portal
            </Link>
          )}
          <button
            onClick={() => (window.location.href = "/api/auth/signout")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 font-bold text-sm"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 lg:p-10 space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">Control Panel</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">Welcome, {session?.user?.name || "User"}</h1>
              <p className="text-slate-600 mt-2">Manage household electricity planning from one place.</p>
            </div>
            <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wider font-black text-slate-500">Account Type</p>
              <p className="font-black text-slate-900 mt-1">{isAdmin ? "Administrator" : "Energy User"}</p>
            </div>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-slate-900 text-lg">Usage Snapshot</h2>
            <span className="text-xs uppercase tracking-wider font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
              {statsLoading ? "Loading..." : "Live Data"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleStats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider font-black text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-2">{statsLoading ? "..." : stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-black text-slate-900 text-lg mb-3">System Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link key={module.title} href={module.href} className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className={`${module.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-slate-900">{module.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{module.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
