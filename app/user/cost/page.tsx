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
    const theme = {
      navy: [15, 23, 42],
      teal: [13, 148, 136],
      slate: [226, 232, 240],
      light: [248, 250, 252],
      text: [15, 23, 42],
    } as const;

    const headerHeight = 26;
    const accentHeight = 3;
    const headerBottom = headerHeight + accentHeight + 6;

    const renderHeader = () => {
      doc.setFillColor(...theme.navy);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFillColor(...theme.teal);
      doc.rect(0, headerHeight, pageWidth, accentHeight, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("OP Energy", 14, 11);
      doc.setFontSize(14);
      doc.text("Bill Breakdown Report", 14, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 11, { align: "right" });
      doc.text(`Entries: ${summary.uses}`, pageWidth - 14, 19, { align: "right" });
      doc.setTextColor(...theme.text);
    };

    const renderFooter = () => {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("openergy.app", 14, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
      }
      doc.setTextColor(...theme.text);
    };

    const renderSummary = (yStart: number) => {
      const cardGap = 4;
      const cardWidth = (pageWidth - 28 - cardGap) / 2;
      const cardHeight = 16;
      const items = [
        { label: "Calculator Uses", value: `${summary.uses}` },
        { label: "Total Days", value: `${summary.totalDays}` },
        { label: "Total Units", value: `${summary.totalUnits.toFixed(2)} kWh` },
        { label: "Total Spend", value: `UGX ${Math.round(summary.totalCost).toLocaleString()}` },
      ];

      items.forEach((item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 14 + col * (cardWidth + cardGap);
        const y = yStart + row * (cardHeight + 4);
        doc.setFillColor(...theme.light);
        doc.setDrawColor(...theme.slate);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, "F");
        doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(item.label, x + 4, y + 6);
        doc.setFontSize(11);
        doc.setTextColor(...theme.text);
        doc.text(item.value, x + 4, y + 12.5);
      });

      return yStart + cardHeight * 2 + 12;
    };

    const renderEntryHeader = (yStart: number, label: string) => {
      doc.setFillColor(...theme.navy);
      doc.rect(14, yStart, pageWidth - 28, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(label, 16, yStart + 4.8);
      doc.setTextColor(...theme.text);
      return yStart + 10;
    };

    renderHeader();
    let y = renderSummary(headerBottom);

    history.forEach((entry, index) => {
      const entryTitle = `${index + 1}. ${new Date(entry.createdAt).toLocaleString()} | ${entry.days} days | UGX ${Math.round(
        entry.totals.estimatedCost
      ).toLocaleString()}`;

      if (y > pageHeight - 30) {
        doc.addPage();
        renderHeader();
        y = headerBottom;
      }

      y = renderEntryHeader(y, entryTitle);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      let rowIndex = 0;
      entry.appliances.forEach((item) => {
        if (y > pageHeight - 18) {
          doc.addPage();
          renderHeader();
          y = renderEntryHeader(headerBottom, `${entryTitle} (continued)`);
        }

        const periodUnits = (item.power * item.hoursPerDay * entry.days) / 1000;
        const itemCost = periodUnits * entry.tariff;
        if (rowIndex % 2 === 0) {
          doc.setFillColor(...theme.light);
          doc.rect(14, y - 4, pageWidth - 28, 6.5, "F");
        }
        doc.text(
          `${item.name} | ${item.power}W | ${item.hoursPerDay}h/day | ${periodUnits.toFixed(2)}kWh | UGX ${Math.round(
            itemCost
          ).toLocaleString()}`,
          16,
          y
        );
        y += 6.5;
        rowIndex += 1;
      });

      y += 4;
    });

    renderFooter();

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
