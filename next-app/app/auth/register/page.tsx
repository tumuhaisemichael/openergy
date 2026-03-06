"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, User, AlertCircle, ArrowRight, Loader2, Globe, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (res.ok) {
        router.push("/auth/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to register. Please check your details.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white selection:bg-blue-100 overflow-hidden">
      {/* Right Column: Visual Content Section (Swapped for Register) */}
      <div className="hidden lg:flex flex-1 bg-gray-900 relative items-center justify-center p-12 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent"
        />

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Globe className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-6xl font-black text-white leading-none tracking-tighter">
                POWERING THE <span className="text-blue-500 italic">FUTURE.</span>
              </h2>
              <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-md">
                Join our community of energy-conscious individuals and take the first step towards zero energy waste.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <ShieldCheck className="w-6 h-6" />, label: "Secure Vault" },
                { icon: <Cpu className="w-6 h-6" />, label: "Edge Logic" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl">
                  <div className="text-blue-500 mb-3">{item.icon}</div>
                  <p className="text-white font-bold text-sm tracking-wide uppercase">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Left Column: Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 bg-white">
        <div className="max-w-[400px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo and Header */}
            <Link href="/" className="inline-flex items-center gap-2 group mb-12">
              <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">OP Energy</span>
            </Link>

            <div className="mb-10">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Create Account</h1>
              <p className="text-gray-500 font-medium">Join the energy revolution today.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-800 leading-tight">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full bg-blue-600 hover:bg-black text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group active:scale-[0.98]",
                  isLoading && "opacity-80 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    GET STARTED <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 font-medium">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 font-black hover:underline underline-offset-4 uppercase text-sm">
                  Log In
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

