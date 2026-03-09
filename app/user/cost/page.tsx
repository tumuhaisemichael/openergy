"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type HistoryEntry = {
  id: string;
  createdAt: string;
  durationValue: number;
  durationUnit: string;
  days: number;
  tariff: number;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
  totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
};

export default function CostPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const historyStorageKey = `openergy:yaka:history:${userKey}`;
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frameId = window.requestAnimationFrame(() => {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as HistoryEntry[];
          setHistory(Array.isArray(parsed) ? parsed : []);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [historyStorageKey]);

  const summary = useMemo(() => {
    const uses = history.length;
    const totalDays = history.reduce((sum, item) => sum + Number(item.days || 0), 0);
    const totalUnits = history.reduce((sum, item) => sum + Number(item.totals?.periodKwh || 0), 0);
    const totalCost = history.reduce((sum, item) => sum + Number(item.totals?.estimatedCost || 0), 0);

    return { uses, totalDays, totalUnits, totalCost };
  }, [history]);

  function downloadBillBreakdownPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("OP Energy - Bill Breakdown Report", 14, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 19);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Calculator Uses: ${summary.uses}`, 14, 36);
    doc.text(`Total Days: ${summary.totalDays}`, 14, 42);
    doc.text(`Total Units: ${summary.totalUnits.toFixed(2)} kWh`, 82, 36);
    doc.text(`Total Spend: UGX ${Math.round(summary.totalCost).toLocaleString()}`, 82, 42);

    let y = 52;

    history.forEach((entry, index) => {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 18;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, y - 4, pageWidth - 24, 9, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(
        `${index + 1}. ${new Date(entry.createdAt).toLocaleString()} | ${entry.days} days | UGX ${Math.round(entry.totals.estimatedCost).toLocaleString()}`,
        14,
        y + 1.5
      );

      y += 8;
      doc.setFont("helvetica", "normal");

      entry.appliances.forEach((item) => {
        if (y > pageHeight - 12) {
          doc.addPage();
          y = 18;
        }

        const periodUnits = (item.power * item.hoursPerDay * entry.days) / 1000;
        const itemCost = periodUnits * entry.tariff;
        doc.text(
          `${item.name} | ${item.power}W | ${item.hoursPerDay}h/day | ${periodUnits.toFixed(2)}kWh | UGX ${Math.round(itemCost).toLocaleString()}`,
          14,
          y
        );
        y += 5;
      });

      y += 4;
    });

    doc.save(`openergy-bill-breakdown-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-black">Billing Module</p>
              <h1 className="page-title mt-2">Bill Breakdown</h1>
              <p className="page-subtitle mt-2">Calculator history only: uses, days, appliances, power, units, and money spent.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadBillBreakdownPdf}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black"
              >
                Download PDF
              </button>
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Calculator Uses" value={String(summary.uses)} />
          <Metric label="Days (All Entries)" value={String(summary.totalDays)} />
          <Metric label="Total Units Used" value={`${summary.totalUnits.toFixed(2)} kWh`} />
          <Metric label="Total Money Spent" value={`UGX ${Math.round(summary.totalCost).toLocaleString()}`} />
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900">History Details</h2>

          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No calculator history found yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, idx) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900 text-sm">
                    #{idx + 1} · {new Date(entry.createdAt).toLocaleString()} · {entry.days} days · Tariff UGX {entry.tariff}
                  </p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="py-1.5">Appliance</th>
                          <th className="py-1.5">Power</th>
                          <th className="py-1.5">Hours/day</th>
                          <th className="py-1.5">Yaka Used (kWh)</th>
                          <th className="py-1.5">Money</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.appliances.map((item, itemIdx) => {
                          const periodUnits = (item.power * item.hoursPerDay * entry.days) / 1000;
                          const itemCost = periodUnits * entry.tariff;

                          return (
                            <tr key={`${entry.id}-${itemIdx}`} className="border-b border-slate-100 text-slate-700">
                              <td className="py-1.5">{item.name}</td>
                              <td className="py-1.5">{item.power}W</td>
                              <td className="py-1.5">{item.hoursPerDay}</td>
                              <td className="py-1.5">{periodUnits.toFixed(2)}</td>
                              <td className="py-1.5">UGX {Math.round(itemCost).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Total Yaka Used: {entry.totals.periodKwh.toFixed(2)} kWh · Total Money Spent: UGX {Math.round(entry.totals.estimatedCost).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-black">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
