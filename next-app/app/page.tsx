import Link from "next/link";
import { Zap, Calculator, Shield, ArrowRight, Save, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100" suppressHydrationWarning>
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">OP Energy</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                NEW: SMART POWER ESTIMATOR
              </div>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-8 italic uppercase">
                Master your <span className="text-blue-600">Yaka</span> usage.
              </h1>
              <p className="text-xl text-gray-500 mb-10 max-w-xl font-medium leading-relaxed">
                Stop the guessing game. Precisely estimate costs, track appliance energy draw, and manage your electricity profile with data-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl flex items-center justify-center gap-2 group">
                  Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/user/yaka" className="bg-white border-2 border-gray-100 hover:border-blue-100 hover:bg-blue-50 text-gray-900 px-8 py-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" /> Use Calculator
                </Link>
              </div>
            </div>

            {/* Visual Element / Card Placeholder */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-transparent rounded-[3rem] -z-10 blur-2xl opacity-50" />
              <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Estimate</p>
                    <p className="text-3xl font-black text-gray-900">UGX 145,000</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Fridge', usage: '24h', power: '200W', color: 'bg-blue-600' },
                    { label: 'TV Set', usage: '6h', power: '150W', color: 'bg-green-500' },
                    { label: 'Iron Box', usage: '0.5h', power: '1000W', color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className={`w-2 h-10 rounded-full ${item.color}`} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.usage} / day</p>
                      </div>
                      <p className="font-black text-sm">{item.power}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black mb-3 italic">Smart Logic</h3>
                <p className="text-gray-500 font-medium leading-relaxed">Advanced algorithms that convert Watts to Units with 99% accuracy based on current tariff rates.</p>
              </div>
              <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Save className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-black mb-3 italic">Cloud Sync</h3>
                <p className="text-gray-500 font-medium leading-relaxed">Save your appliance configurations once and access them from any device, anytime.</p>
              </div>
              <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black mb-3 italic">Admin Insights</h3>
                <p className="text-gray-500 font-medium leading-relaxed">Comprehensive management tools for administrators to monitor trends and user growth.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <Zap className="w-5 h-5" />
            <span className="text-lg font-black tracking-tighter uppercase">OP Energy</span>
          </div>
          <div className="text-gray-400 text-sm font-bold">
            © 2025 OP Energy. Uganda's #1 Power Management Solution.
          </div>
        </div>
      </footer>
    </div>
  );
}

