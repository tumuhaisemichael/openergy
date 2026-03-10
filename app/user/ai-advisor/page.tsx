"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type HistoryEntry = {
  id: string;
  createdAt: string;
  days: number;
  tariff: number;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
  totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
};

type LevelPlan = {
  level: "Light" | "Balanced" | "Aggressive";
  reductionPct: number;
  projectedDailyKwh: number;
  projectedMonthlySavings: number;
  tips: string[];
};

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function AiAdvisorPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const historyStorageKey = `openergy:yaka:history:${userKey}`;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "AI chat area ready. Select a history entry and ask for targeted savings ideas.",
    },
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frameId = window.requestAnimationFrame(() => {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) {
        setHistory([]);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        const rows = Array.isArray(parsed) ? parsed : [];
        setHistory(rows);
        if (rows[0]?.id) setSelectedId(rows[0].id);
      } catch {
        setHistory([]);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [historyStorageKey]);

  const selectedEntry = useMemo(() => history.find((item) => item.id === selectedId) || history[0], [history, selectedId]);

  const topAppliances = useMemo(() => {
    if (!selectedEntry) return [];

    return [...selectedEntry.appliances]
      .map((item) => {
        const dailyKwh = (item.power * item.hoursPerDay) / 1000;
        return { ...item, dailyKwh };
      })
      .sort((a, b) => b.dailyKwh - a.dailyKwh)
      .slice(0, 4);
  }, [selectedEntry]);

  const levelPlans = useMemo<LevelPlan[]>(() => {
    if (!selectedEntry) return [];

    const baseDaily = Number(selectedEntry.totals.dailyKwh || 0);
    const tariff = Number(selectedEntry.tariff || 805);
    const topNames = topAppliances.map((item) => item.name).join(", ");

    const baseTips = topAppliances.length
      ? [`Prioritize reducing usage from: ${topNames}.`, "Shift heavy appliances to shorter active windows."]
      : ["Collect more history for targeted advice."];

    const makePlan = (level: LevelPlan["level"], reductionPct: number, extraTip: string): LevelPlan => {
      const projectedDailyKwh = baseDaily * (1 - reductionPct / 100);
      const projectedMonthlySavings = (baseDaily - projectedDailyKwh) * tariff * 30;

      return {
        level,
        reductionPct,
        projectedDailyKwh,
        projectedMonthlySavings,
        tips: [...baseTips, extraTip],
      };
    };

    return [
      makePlan("Light", 8, "Trim 0.5h/day from top two appliances."),
      makePlan("Balanced", 15, "Trim 1h/day from top appliances and cap standby usage."),
      makePlan("Aggressive", 25, "Strict schedule: keep only essential loads at normal hours."),
    ];
  }, [selectedEntry, topAppliances]);

  const generalTips = useMemo(() => {
    const base = [
      "Switch off appliances fully instead of standby where possible.",
      "Use natural lighting during daytime to cut lighting load.",
      "Run high-watt appliances in shorter, planned sessions.",
      "Review weekly usage and adjust heavy appliance hours early.",
    ];

    if (!selectedEntry) return base;

    const highLoad = [...selectedEntry.appliances]
      .sort((a, b) => b.power * b.hoursPerDay - (a.power * a.hoursPerDay))
      .slice(0, 2)
      .map((item) => item.name);

    if (highLoad.length > 0) {
      return [`Focus first on: ${highLoad.join(" and ")}.`, ...base];
    }

    return base;
  }, [selectedEntry]);

  function askAi() {
    const prompt = chatInput.trim();
    if (!prompt) return;

    const entry = selectedEntry;
    const baseline = entry ? `${entry.totals.dailyKwh.toFixed(2)} kWh/day` : "no baseline yet";
    const tip = levelPlans[1]?.tips[0] || "Reduce high-consumption appliance hours first.";

    setChat((prev) => [
      ...prev,
      { role: "user", text: prompt },
      {
        role: "assistant",
        text: `Based on your selected history (${baseline}), start with: ${tip}`,
      },
    ]);

    setChatInput("");
  }

  function downloadAdvisorPdf() {
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
      doc.text("AI Advisor Report", 14, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 11, { align: "right" });
      doc.text(`Plans: ${levelPlans.length}`, pageWidth - 14, 19, { align: "right" });
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

    renderHeader();

    let y = headerBottom;
    doc.setFillColor(...theme.light);
    doc.setDrawColor(...theme.slate);
    doc.roundedRect(14, y, pageWidth - 28, 16, 2.5, 2.5, "F");
    doc.roundedRect(14, y, pageWidth - 28, 16, 2.5, 2.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Selected history", 18, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...theme.text);
    doc.text(
      selectedEntry ? `${new Date(selectedEntry.createdAt).toLocaleString()} (${selectedEntry.days} days)` : "None selected",
      18,
      y + 12
    );
    y += 24;

    levelPlans.forEach((plan) => {
      const lineHeight = 5;
      const tipsHeight = plan.tips.length * lineHeight;
      const cardHeight = 22 + tipsHeight;

      if (y + cardHeight > pageHeight - 18) {
        doc.addPage();
        renderHeader();
        y = headerBottom;
      }

      doc.setFillColor(...theme.light);
      doc.setDrawColor(...theme.slate);
      doc.roundedRect(14, y, pageWidth - 28, cardHeight, 2.5, 2.5, "F");
      doc.roundedRect(14, y, pageWidth - 28, cardHeight, 2.5, 2.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${plan.level} Plan`, 18, y + 7);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Target reduction: ${plan.reductionPct}%`, 18, y + 12);
      doc.setTextColor(...theme.text);

      doc.setFont("helvetica", "normal");
      doc.text(`Projected daily usage: ${plan.projectedDailyKwh.toFixed(2)} kWh`, 120, y + 7);
      doc.text(`Estimated monthly savings: UGX ${Math.round(plan.projectedMonthlySavings).toLocaleString()}`, 120, y + 12);

      let tipsY = y + 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Tips", 18, tipsY);
      tipsY += 5;
      doc.setFont("helvetica", "normal");
      plan.tips.forEach((tip) => {
        doc.text(`- ${tip}`, 20, tipsY);
        tipsY += lineHeight;
      });

      y += cardHeight + 6;
    });

    renderFooter();

    doc.save(`openergy-ai-advisor-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-black">AI Module</p>
              <h1 className="page-title mt-2">AI Advisor</h1>
              <p className="page-subtitle mt-2">Click a calculator history entry to see savings plans by level, plus chat-ready advisor space.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadAdvisorPdf}
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="card p-5 xl:col-span-1 space-y-3">
            <h2 className="text-lg font-black text-slate-900">Calculator History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No history found.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selectedEntry?.id === item.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.days} days · {item.totals.periodKwh.toFixed(2)} kWh · UGX {Math.round(item.totals.estimatedCost).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </section>

          <section className="card p-5 xl:col-span-2 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Savings Levels</h2>
            {!selectedEntry ? (
              <p className="text-sm text-slate-500">Select a history entry to view recommendations.</p>
            ) : (
              <div className="space-y-3">
                {levelPlans.map((plan) => (
                  <div key={plan.level} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">{plan.level} Plan</p>
                    <p className="text-sm text-slate-700 mt-1">
                      New daily target: {plan.projectedDailyKwh.toFixed(2)} kWh · Potential monthly savings: UGX {Math.round(plan.projectedMonthlySavings).toLocaleString()}
                    </p>
                    <ul className="mt-2 text-sm text-slate-600 list-disc pl-5">
                      {plan.tips.map((tip, idx) => (
                        <li key={`${plan.level}-${idx}`}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="card p-5 space-y-3">
          <h2 className="text-lg font-black text-slate-900">General Power Saving Tips</h2>
          <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
            {generalTips.map((tip, idx) => (
              <li key={`general-tip-${idx}`}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="text-lg font-black text-slate-900">Advisor Chat (Reserved Space)</h2>
          <p className="text-sm text-slate-600">This area is ready for a richer AI chat integration. You can already use a basic local assistant response.</p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-56 overflow-y-auto">
            {chat.map((msg, idx) => (
              <div key={idx} className={`text-sm ${msg.role === "assistant" ? "text-slate-700" : "text-blue-700 font-semibold"}`}>
                {msg.role === "assistant" ? "Advisor" : "You"}: {msg.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for advice based on selected history..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            />
            <button
              type="button"
              onClick={askAi}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Ask
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
