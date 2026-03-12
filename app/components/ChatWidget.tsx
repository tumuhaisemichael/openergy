"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

const introMessage =
  "Hi, I'm OPbot. I help optimize your power usage using your history and practical energy tips. Select a history entry and ask me anything.";

export default function ChatWidget() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([{ role: "assistant", text: introMessage }]);

  const userKey = session?.user?.id || "anonymous";
  const historyStorageKey = `openergy:yaka:history:${userKey}`;

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
    if (!prompt || isAsking) return;

    const entry = selectedEntry;
    const context = {
      selectedEntry: entry
        ? {
            createdAt: entry.createdAt,
            days: entry.days,
            tariff: entry.tariff,
            totals: entry.totals,
            appliances: entry.appliances,
          }
        : null,
      topAppliances,
      levelPlans,
      generalTips,
    };

    setChat((prev) => [...prev, { role: "user", text: prompt }]);
    setChatInput("");
    setIsAsking(true);

    void fetch("/api/ai/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.error || "OPbot is unavailable right now.";
          setChat((prev) => [...prev, { role: "assistant", text: message }]);
          return;
        }

        const payload = await res.json();
        const reply = payload?.reply || "No response received yet. Try again.";
        setChat((prev) => [...prev, { role: "assistant", text: reply }]);
      })
      .catch(() => {
        setChat((prev) => [...prev, { role: "assistant", text: "Network error. Please try again." }]);
      })
      .finally(() => {
        setIsAsking(false);
      });
  }

  if (pathname === "/") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close OPbot" : "Open OPbot"}
        className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:scale-[1.02] hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.5-4.5A8 8 0 1 1 21 12z" />
        </svg>
      </button>

      {isOpen ? (
        <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-black">OPbot</p>
              <p className="text-sm text-slate-600">Power optimization advisor</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">History entry</label>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No history found yet.</p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {history.map((item) => (
                  <option key={item.id} value={item.id}>
                    {new Date(item.createdAt).toLocaleString()} ({item.days} days)
                  </option>
                ))}
              </select>
            )}
            <Link href="/user/ai-advisor" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Open full advisor page
            </Link>
          </div>

          <div className="flex h-[calc(100%-214px)] flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {chat.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    msg.role === "assistant" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <span className="font-semibold">{msg.role === "assistant" ? "OPbot" : "You"}:</span> {msg.text}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask OPbot about your power usage..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  disabled={isAsking}
                />
                <button
                  type="button"
                  onClick={askAi}
                  disabled={isAsking || !chatInput.trim()}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAsking ? "Asking..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
