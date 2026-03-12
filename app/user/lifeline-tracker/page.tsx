"use client";

import Link from "next/link";
import { Gauge, ArrowRight } from "lucide-react";
import HelpOverlay from "@/app/components/HelpOverlay";

const helpContent = {
  title: "Lifeline & Cooking Tier Tracker",
  description:
    "Track where your monthly units sit inside Uganda's tiered tariff bands so you can avoid crossing into more expensive tiers unexpectedly.",
  howTo: [
    "Enter how many units you have used this month.",
    "Choose the tariff profile that matches your meter.",
    "Click calculate to see your position and remaining units in each tier.",
  ],
  results: [
    "A visual tier bar showing your current band.",
    "Alerts when you are near a tier boundary.",
    "Guidance on how many cheaper units remain.",
  ],
};

export default function LifelineTrackerPage() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">Tariff Guard</p>
              <h1 className="page-title mt-2">Lifeline & Cooking Tier Tracker</h1>
              <p className="page-subtitle mt-2">
                See your current unit tier, how many cheaper units remain, and exactly when the next price band will start.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HelpOverlay {...helpContent} />
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-lg font-black text-slate-900">Monthly Tier Progress</h2>
            <p className="text-sm text-slate-600 mt-2">
              This tracker highlights how many units remain in Lifeline (0-15), Standard (16-80), and Cooking (81-150) tiers.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Gauge className="w-5 h-5 text-blue-600" />
                Tier progress visualization will appear here.
              </div>
              <div className="mt-4 h-4 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div className="h-full w-1/4 bg-blue-600" />
              </div>
              <p className="mt-3 text-xs text-slate-500">Example only. Connect your usage history to update.</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Quick Inputs</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Units used this month
              <input
                type="number"
                min={0}
                placeholder="e.g. 42"
                className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Current tariff profile
              <select className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <option>Default Uganda Tier</option>
              </select>
            </label>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2">
              Calculate Tier Position <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="card p-6">
          <h3 className="text-base font-black text-slate-900">Why This Matters</h3>
          <p className="text-sm text-slate-600 mt-2">
            The tracker will warn you before crossing a tier so you can plan heavy appliance usage for cheaper windows.
          </p>
        </section>
      </div>
    </div>
  );
}
