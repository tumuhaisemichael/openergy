"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

type HelpOverlayProps = {
  title: string;
  description: string;
  howTo: string[];
  results: string[];
};

export default function HelpOverlay({ title, description, howTo, results }: HelpOverlayProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "instructions">("overview");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        <HelpCircle className="h-4 w-4 text-blue-600" />
        Help
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">Help Center</p>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{title}</h2>
                <p className="text-sm text-slate-600 mt-2">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Close help dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setTab("overview")}
                  className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                    tab === "overview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Feature Overview
                </button>
                <button
                  type="button"
                  onClick={() => setTab("instructions")}
                  className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                    tab === "instructions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  How It Works
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              {tab === "overview" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-black">What this does</p>
                    <p className="mt-2 text-sm text-slate-700">{description}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-black">Expected results</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {results.map((item, idx) => (
                        <li key={`result-${idx}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-black">Instructions</p>
                  <ol className="space-y-2 text-sm text-slate-700">
                    {howTo.map((item, idx) => (
                      <li key={`step-${idx}`} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-black">What to expect</p>
                    <p className="mt-2 text-sm text-slate-700">
                      After you follow the steps, the system will calculate and display the results described above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
