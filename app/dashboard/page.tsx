"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BrainCircuit,
  Calculator,
  Cpu,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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
    desc: "Calculator usage totals and history bill details",
    href: "/user/cost",
    icon: Wallet,
    color: "bg-indigo-600",
  },
  {
    title: "AI Advisor",
    desc: "History-based savings levels and advisor chat area",
    href: "/user/ai-advisor",
    icon: BrainCircuit,
    color: "bg-sky-600",
  },
  {
    title: "Predictions",
    desc: "Monthly appliance-by-appliance power and money forecast",
    href: "/user/predictions",
    icon: TrendingUp,
    color: "bg-violet-600",
  },
  {
    title: "Money Planner",
    desc: "Budget + duration planner with appliance list support",
    href: "/user/money-planner",
    icon: PiggyBank,
    color: "bg-rose-600",
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

  const graphRows = useMemo(() => {
    return savedAppliances.map((item) => {
      const hours = Math.max(0, Math.min(24, Number(item.hoursPerDay || 0)));
      const dailyKwh = (Number(item.power) * hours) / 1000;
      return {
        name: item.name,
        dailyKwh,
      };
    });
  }, [savedAppliances]);

  const barData = useMemo(
    () => ({
      labels: graphRows.map((row) => row.name),
      datasets: [
        {
          label: "Estimated Daily kWh",
          data: graphRows.map((row) => Number(row.dailyKwh.toFixed(3))),
          backgroundColor: "#2563eb",
          borderRadius: 6,
        },
      ],
    }),
    [graphRows]
  );

  const doughnutData = useMemo(
    () => ({
      labels: graphRows.map((row) => row.name),
      datasets: [
        {
          label: "Usage Share",
          data: graphRows.map((row) => Number(row.dailyKwh.toFixed(3))),
          backgroundColor: ["#2563eb", "#16a34a", "#f59e0b", "#14b8a6", "#a855f7", "#ef4444", "#0ea5e9", "#84cc16"],
          borderWidth: 1,
        },
      ],
    }),
    [graphRows]
  );

  const dashboardTips = useMemo(() => {
    if (graphRows.length === 0) {
      return [
        "Add and save appliance usage in the calculator to get personalized tips.",
        "Keep track of high-watt appliances and reduce unnecessary runtime.",
      ];
    }

    const highest = [...graphRows].sort((a, b) => b.dailyKwh - a.dailyKwh)[0];
    const tipA = highest ? `Top daily load is ${highest.name}. Reducing it by 1h/day can noticeably cut monthly cost.` : "";

    return [
      tipA,
      "Switch off standby loads overnight where safe.",
      "Set weekly appliance-hour targets and compare against history.",
    ].filter(Boolean);
  }, [graphRows]);

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
          <SideNavLink
            href="/dashboard"
            label="Dashboard"
            description="Overview of your energy activity and quick access modules."
            active
            icon={<LayoutDashboard className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/yaka"
            label="Calculator"
            description="Build appliance usage and estimate units and spend."
            icon={<Calculator className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/cost"
            label="Bill Breakdown"
            description="See calculator usage count, day totals, units and spend history."
            icon={<Wallet className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/ai-advisor"
            label="AI Advisor"
            description="Open AI savings levels and history-based advisor chat workspace."
            icon={<BrainCircuit className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/predictions"
            label="Prediction"
            description="Detailed monthly prediction by appliance power and money."
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/money-planner"
            label="Money Planner"
            description="Plan how long your money lasts and recommended appliance hours."
            icon={<PiggyBank className="w-5 h-5" />}
          />
          <SideNavLink
            href="/user/update"
            label="Profile"
            description="Update your account details used across modules."
            icon={<User className="w-5 h-5" />}
          />
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

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-black text-slate-900 text-lg mb-3">Power Usage by Appliance</h2>
            {graphRows.length === 0 ? (
              <p className="text-sm text-slate-500">No saved appliance data yet.</p>
            ) : (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: "kWh/day" } },
                    x: { ticks: { maxRotation: 45, minRotation: 0 } },
                  },
                }}
              />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-black text-slate-900 text-lg mb-3">AI General Power Tips</h2>
            <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1 mb-4">
              {dashboardTips.map((tip, idx) => (
                <li key={`dash-tip-${idx}`}>{tip}</li>
              ))}
            </ul>

            {graphRows.length > 0 && (
              <div className="max-w-sm">
                <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SideNavLink({
  href,
  label,
  description,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <div className="relative group">
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
          active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        {icon} {label}
      </Link>
      <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden w-56 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg group-hover:block">
        {description}
      </div>
    </div>
  );
}
