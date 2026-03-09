import Link from "next/link";
import { Home, Users, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "Manage Users",
    subtitle: "View accounts and saved appliance profiles.",
    href: "/admin/users",
    icon: Users,
    style: "from-blue-600 to-blue-700",
  },
  {
    title: "Switch To User View",
    subtitle: "Go back to standard dashboard modules.",
    href: "/dashboard",
    icon: Home,
    style: "from-slate-700 to-slate-800",
  },
];

export default function AdminDashboard() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-5">
        <div className="card p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-100 text-amber-700 px-3 py-2 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Admin Portal
          </div>
          <h1 className="page-title mt-3">Admin Management Hub</h1>
          <p className="page-subtitle mt-2">Oversee users and usage records from a single control center.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-2xl bg-gradient-to-br ${card.style} p-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-white`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{card.title}</h2>
                <p className="text-sm text-white/80 mt-1 font-medium">{card.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
