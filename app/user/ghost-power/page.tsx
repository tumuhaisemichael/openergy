"use client";

import Link from "next/link";
import { PlugZap, ArrowRight } from "lucide-react";
import HelpOverlay from "@/app/components/HelpOverlay";

const helpContent = {
  title: "Ghost Power Detector",
  description:
    "Measure standby power from appliances that stay plugged in and reveal the monthly cost of “vampire” loads.",
  howTo: [
    "List appliances that remain plugged in even when off.",
    "Enter their standby wattage or use default values.",
    "Run the audit to see standby kWh and monthly UGX cost.",
  ],
  results: [
    "A ranked list of standby costs per appliance.",
    "Total monthly spend caused by always-on loads.",
    "Clear targets for switching off at the socket.",
  ],
};

export default function GhostPowerPage() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-black">Vampire Load</p>
              <h1 className="page-title mt-2">Ghost Power Detector</h1>
              <p className="page-subtitle mt-2">
                Identify hidden standby consumption and the exact UGX cost of leaving devices plugged in all month.
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
            <h2 className="text-lg font-black text-slate-900">Standby Audit</h2>
            <p className="text-sm text-slate-600 mt-2">
              Mark appliances that are always plugged in and assign a standby wattage. The audit will show monthly kWh and UGX.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { name: "Decoder / TV Box", standby: "6W" },
                { name: "TV Standby", standby: "4W" },
                { name: "Microwave Clock", standby: "3W" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">Default standby: {item.standby}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Always Plugged In</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Quick Entry</h2>
            <label className="block text-sm font-semibold text-slate-700">
              Appliance name
              <input placeholder="e.g. TV" className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Standby watts
              <input type="number" min={0} placeholder="e.g. 4" className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Always plugged in
              <select className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2">
              Add to Audit <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <PlugZap className="w-5 h-5 text-emerald-600" />
            The full audit will summarize standby kWh and monthly cost per appliance.
          </div>
        </section>
      </div>
    </div>
  );
}
