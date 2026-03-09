"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, AlertCircle, ArrowRight, Loader2, Sparkles, Battery, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const floatingZaps = [
  { left: "8%", top: "14%", size: 28, duration: 6, delay: 0 },
  { left: "22%", top: "72%", size: 40, duration: 7, delay: 1.2 },
  { left: "39%", top: "28%", size: 34, duration: 8, delay: 2.1 },
  { left: "58%", top: "83%", size: 44, duration: 9, delay: 3 },
  { left: "76%", top: "18%", size: 36, duration: 7.5, delay: 3.8 },
  { left: "90%", top: "58%", size: 30, duration: 6.5, delay: 4.6 },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  useEffect(() => {
    let active = true;
    getProviders()
      .then((providers) => {
        if (!active) return;
        setGoogleEnabled(Boolean(providers?.google));
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    if (!googleEnabled) {
      setError("Google sign-in is not configured yet. Please use email/password login.");
      return;
    }
    setIsLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

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

            {registered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl"
              >
                <p className="text-sm font-bold text-green-800 leading-tight">
                  Account created successfully. Sign in to continue.
                </p>
              </motion.div>
            )}

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
                    minLength={8}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-400 ml-1">Use the same password you created during registration.</p>
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

            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold">
                  <span className="bg-white px-4 text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                type="button"
                disabled={isLoading || !googleEnabled}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleEnabled ? "Google Account" : "Google Unavailable"}
              </button>
            </div>

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
          {floatingZaps.map((zap, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -100, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{ 
                duration: zap.duration,
                repeat: Infinity,
                delay: zap.delay
              }}
              className="absolute text-blue-500/20"
              style={{ 
                left: zap.left,
                top: zap.top,
              }}
            >
              <Zap size={zap.size} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
