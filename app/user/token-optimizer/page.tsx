"use client";

import Link from "next/link";
import { Coins, ArrowRight } from "lucide-react";
import HelpOverlay from "@/app/components/HelpOverlay";

const helpContent = {
  title: "Load-O-Meter Purchase Optimizer",
  description:
    "Compare how many units you receive if you buy tokens now versus after the monthly tier reset, so you can maximize units.",
  howTo: [
    "Enter the token amount you plan to buy in UGX.",
    "Provide how many units you have already used this month.",
    "Run the optimizer to compare units for buying now vs next month.",
  ],
  results: [
    "Side-by-side unit totals for both purchase timings.",
    "A clear recommendation on which timing yields more units.",
    "Context on how tier resets affect your purchase.",
  ],
};

export default function TokenOptimizerPage() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-black">Token Planner</p>
              <h1 className="page-title mt-2">Load-O-Meter Purchase Optimizer</h1>
              <p className="page-subtitle mt-2">
                Check whether buying today or after the tier reset gives you more units for the same money.
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
            <h2 className="text-lg font-black text-slate-900">Purchase Comparison</h2>
            <p className="text-sm text-slate-600 mt-2">
              Enter the amount you plan to buy and see how many units you receive if you purchase now vs after the monthly reset.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-wider font-black text-slate-500">Buy Now</p>
                <p className="mt-3 text-3xl font-black text-slate-900">-- units</p>
                <p className="text-sm text-slate-600 mt-2">Based on remaining Lifeline/Cooking tiers.</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs uppercase tracking-wider font-black text-amber-700">Buy on 1st</p>
                <p className="mt-3 text-3xl font-black text-slate-900">-- units</p>
                <p className="text-sm text-slate-600 mt-2">Tier reset gives access to cheaper units.</p>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Quick Inputs</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Token amount (UGX)
              <input type="number" min={0} placeholder="e.g. 20000" className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Units used this month
              <input type="number" min={0} placeholder="e.g. 55" className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Tariff profile
              <select className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <option>Default Uganda Tier</option>
              </select>
            </label>
            <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2">
              Optimize Purchase <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <Coins className="w-5 h-5 text-amber-600" />
            This tool will simulate tier changes and show which purchase timing yields more units.
          </div>
        </section>
      </div>
    </div>
  );
}
