"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, AlertCircle, ArrowRight, Loader2, Sparkles, Battery, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LoginPage() {
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
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white selection:bg-blue-100 overflow-hidden">
      {/* Left Column: Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 z-10 bg-white">
        <div className="max-w-[400px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 group mb-12">
              <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">OP Energy</span>
            </Link>

            <div className="mb-10">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back.</h1>
              <p className="text-gray-500 font-medium">Continue managing your energy footprint.</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-gray-700">Password</label>
                  <Link href="/auth/forgot-password" title="Coming soon!" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
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
                    LOG IN <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 font-medium">
                New to the platform?{" "}
                <Link href="/auth/register" className="text-blue-600 font-black hover:underline underline-offset-4 uppercase text-sm">
                  Join OP Energy
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Visual Content Section */}
      <div className="hidden lg:flex flex-1 bg-gray-900 relative items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full"
        />

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
                Efficiency is the new <span className="text-blue-500">Currency.</span>
              </h2>
              <p className="text-xl text-gray-400 font-medium leading-relaxed">
                OP Energy gives you the blueprint to master your power consumption and slash unnecessary utility costs.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid gap-4">
              {[
                { icon: <Battery className="w-5 h-5" />, title: "Precision Tracking", text: "Real-time cost conversion" },
                { icon: <Zap className="w-5 h-5" />, title: "Smart Optimization", text: "Appliance usage insights" },
                { icon: <Lightbulb className="w-5 h-5" />, title: "Energy Savings", text: "Data-driven budgeting" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{feature.title}</h4>
                    <p className="text-gray-500 text-xs font-medium">{feature.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating Accent Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -100, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity,
                delay: i * 1.5
              }}
              className="absolute text-blue-500/20"
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%` 
              }}
            >
              <Zap size={24 + Math.random() * 48} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
