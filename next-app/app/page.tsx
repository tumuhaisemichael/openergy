import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-black tracking-tight text-blue-600">YakaManager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
            <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight mb-8">
              Take full control of your <span className="text-blue-600">Yaka usage.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl font-medium leading-relaxed">
              Estimate your electricity consumption, track your appliance costs, and manage your energy profile all in one place. Stop guessing and start saving.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-black transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                Go to Dashboard <span>&rarr;</span>
              </Link>
              <Link href="/user/yaka" className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-2xl text-lg font-black transition-all flex items-center justify-center gap-2">
                Calculator <span>📊</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
                <div className="text-3xl mb-4">🔢</div>
                <h3 className="text-xl font-black mb-2">Smart Estimates</h3>
                <p className="text-gray-600 font-medium">Precisely calculate your Yaka units based on specific appliance ratings and daily usage hours.</p>
              </div>
              <div className="p-8 bg-green-50 rounded-3xl border border-green-100">
                <div className="text-3xl mb-4">💾</div>
                <h3 className="text-xl font-black mb-2">Profile Sync</h3>
                <p className="text-gray-600 font-medium">Save your appliance configurations to your personal profile so you never have to re-enter them again.</p>
              </div>
              <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100">
                <div className="text-3xl mb-4">🛡️</div>
                <h3 className="text-xl font-black mb-2">Admin Portal</h3>
                <p className="text-gray-600 font-medium">Complete user management system allowing administrators to oversee usage patterns across the platform.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-black tracking-tight">YakaManager</span>
          </div>
          <div className="text-gray-400 text-sm font-medium">
            &copy; 2025 Yaka & Power Manager. Built for the modern user.
          </div>
        </div>
      </footer>
    </div>
  );
}
