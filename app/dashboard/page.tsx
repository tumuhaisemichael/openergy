"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Zap, 
  Calculator, 
  User, 
  TrendingUp, 
  History, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Power
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.usertype === "admin";

  const cards = [
    {
      title: "Usage Calculator",
      desc: "Estimate costs & power draw",
      href: "/user/yaka",
      icon: <Calculator className="w-6 h-6" />,
      color: "bg-blue-600",
      shadow: "shadow-blue-200"
    },
    {
      title: "Cost Breakdown",
      desc: "View tariffs & unit rates",
      href: "/user/cost",
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-indigo-600",
      shadow: "shadow-indigo-200"
    },
    {
      title: "Power Profile",
      desc: "Manage saved appliances",
      href: "/user/update",
      icon: <User className="w-6 h-6" />,
      color: "bg-emerald-600",
      shadow: "shadow-emerald-200"
    },
  ];

  const stats = [
    { label: "Est. Monthly Units", value: "142.5", trend: "+2.1%", icon: <Zap className="w-4 h-4" /> },
    { label: "Daily Average", value: "UGX 4,800", trend: "-0.4%", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Active Appliances", value: "12", trend: "Stable", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans selection:bg-blue-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-100 p-8 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 group mb-12">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 uppercase">OP Energy</span>
        </Link>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm transition-all">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/user/yaka" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold text-sm transition-all group">
            <Calculator className="w-5 h-5 group-hover:text-blue-600" /> Calculator
          </Link>
          <Link href="/user/cost" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold text-sm transition-all group">
            <Wallet className="w-5 h-5 group-hover:text-blue-600" /> Bill Breakdown
          </Link>
          <Link href="/user/update" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold text-sm transition-all group">
            <User className="w-5 h-5 group-hover:text-blue-600" /> Profile
          </Link>
        </nav>

        <div className="pt-8 border-t border-gray-50 space-y-2">
          {isAdmin && (
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-amber-600 bg-amber-50 rounded-2xl font-bold text-sm transition-all">
              <ShieldCheck className="w-5 h-5" /> Admin Portal
            </Link>
          )}
          <button 
            onClick={() => window.location.href = '/api/auth/signout'}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold text-sm transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-gray-900 tracking-tight"
            >
              Control Center.
            </motion.h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">
              Welcome back, <span className="text-blue-600">{session?.user?.name || 'User'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg">
              {session?.user?.name?.[0] || 'U'}
            </div>
            <div className="pr-4">
              <p className="text-xs font-black text-gray-900 leading-none">{session?.user?.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1 italic">{isAdmin ? 'Administrator' : 'Energy User'}</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform">
                {stat.icon}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
                <span className={cn(
                  "text-xs font-black px-2 py-1 rounded-lg",
                  stat.trend.startsWith('+') ? "text-red-500 bg-red-50" : stat.trend === "Stable" ? "text-gray-400 bg-gray-50" : "text-emerald-500 bg-emerald-50"
                )}>
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 italic uppercase">
            <Power className="w-5 h-5 text-blue-600" /> System Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((card, i) => (
              <Link key={i} href={card.href} className="group">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="relative h-64 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between group-hover:shadow-2xl group-hover:shadow-blue-100 group-hover:-translate-y-2 transition-all duration-500"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", card.color, card.shadow)}>
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 mb-1">{card.title}</h4>
                    <p className="text-sm font-medium text-gray-400">{card.desc}</p>
                  </div>
                  <div className="absolute top-8 right-8 text-gray-200 group-hover:text-blue-600 transition-colors">
                    <ArrowUpRight className="w-8 h-8" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gray-900 rounded-[3rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black text-white mb-2 leading-none">Smart Efficiency Mode.</h3>
              <p className="text-gray-400 font-medium">Your energy data is being synced in real-time with our cloud nodes.</p>
            </div>
            <button className="bg-white text-gray-900 font-black px-8 py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-black/50 whitespace-nowrap uppercase text-sm tracking-wider">
              Optimize Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
