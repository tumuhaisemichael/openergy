"use client";

import Link from "next/link";
import React from "react";

export default function CostPage() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-3xl">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-black">Billing Module</p>
              <h1 className="page-title mt-2">Cost Breakdown</h1>
              <p className="page-subtitle mt-2">
                Detailed tariff logic and bill decomposition are next in the roadmap. This page will show unit tiers,
                fixed charges, and projected monthly totals.
              </p>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Coming soon: tiered tariff calculator with downloadable monthly summary.
          </div>
        </div>
      </div>
    </div>
  );
}
