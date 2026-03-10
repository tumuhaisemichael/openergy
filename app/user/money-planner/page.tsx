"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

type Appliance = { name: string; power: number; hoursPerDay?: number };
type PlannerAppliance = { id: string; name: string; power: number; hoursPerDay: number };
type ApplianceList = {
  id: string;
  name: string;
  createdAt: string;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
};

type PlanMode = "comfort" | "balanced" | "survival";

type PlanResult = {
  allowedDailyKwh: number;
  rows: Array<{ name: string; recommendedHours: number; dailyKwh: number; dailyCost: number; note: string }>;
  plannedDailyKwh: number;
  feasible: boolean;
  estimatedDaysMoneyLasts: number;
};

export default function MoneyPlannerPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const listsStorageKey = `openergy:yaka:lists:${userKey}`;
  const customAppliancesKey = `openergy:custom-appliances:${userKey}`;

  const [availableAppliances, setAvailableAppliances] = useState<Appliance[]>([]);
  const [applianceLists, setApplianceLists] = useState<ApplianceList[]>([]);
  const [plannerAppliances, setPlannerAppliances] = useState<PlannerAppliance[]>([]);

  const [money, setMoney] = useState(120000);
  const [targetDaysInput, setTargetDaysInput] = useState<string>("");
  const [tariff, setTariff] = useState(805);
  const [mode, setMode] = useState<PlanMode>("balanced");

  const [result, setResult] = useState<PlanResult | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      let defaults: Appliance[] = [];
      let customs: Appliance[] = [];
      let lists: ApplianceList[] = [];

      try {
        const defaultRes = await fetch("/api/user/appliances");
        const defaultJson = await defaultRes.json();
        defaults = Array.isArray(defaultJson.appliances) ? defaultJson.appliances : [];
      } catch {
        defaults = [];
      }

      if (typeof window !== "undefined") {
        const rawCustom = window.localStorage.getItem(customAppliancesKey);
        if (rawCustom) {
          try {
            customs = JSON.parse(rawCustom) as Appliance[];
          } catch {
            customs = [];
          }
        }

        const rawLists = window.localStorage.getItem(listsStorageKey);
        if (rawLists) {
          try {
            lists = JSON.parse(rawLists) as ApplianceList[];
          } catch {
            lists = [];
          }
        }
      }

      const merged = [...customs, ...defaults];
      const unique = new Map<string, Appliance>();
      merged.forEach((item) => {
        const key = item.name.trim().toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, {
            name: item.name,
            power: Number(item.power),
            hoursPerDay: Number(item.hoursPerDay || 1),
          });
        }
      });

      if (active) {
        const rows = Array.from(unique.values());
        setAvailableAppliances(rows);
        setApplianceLists(Array.isArray(lists) ? lists : []);
        if (rows.length > 0) {
          setPlannerAppliances(
            rows.slice(0, 4).map((item, idx) => ({
              id: `seed-${idx}-${Date.now()}`,
              name: item.name,
              power: Number(item.power),
              hoursPerDay: Number(item.hoursPerDay || 1),
            }))
          );
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [listsStorageKey, customAppliancesKey]);

  function addAppliance(index: number) {
    const item = availableAppliances[index];
    if (!item) return;

    setPlannerAppliances((prev) => [
      ...prev,
      {
        id: `${item.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: item.name,
        power: Number(item.power),
        hoursPerDay: Number(item.hoursPerDay || 1),
      },
    ]);
  }

  function loadListIntoPlanner(list: ApplianceList) {
    setPlannerAppliances(
      list.appliances.map((item, idx) => ({
        id: `${list.id}-${idx}-${Date.now()}`,
        name: item.name,
        power: Number(item.power),
        hoursPerDay: Number(item.hoursPerDay || 1),
      }))
    );
  }

  function updateHours(id: string, hours: number) {
    setPlannerAppliances((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              hoursPerDay: Number.isFinite(hours) ? Math.max(0, Math.min(24, hours)) : 0,
            }
          : item
      )
    );
  }

  function removePlannerAppliance(id: string) {
    setPlannerAppliances((prev) => prev.filter((item) => item.id !== id));
  }

  const currentDailyUsageKwh = useMemo(() => {
    return plannerAppliances.reduce((sum, item) => sum + (item.power * item.hoursPerDay) / 1000, 0);
  }, [plannerAppliances]);

  function calculatePlan() {
    const parsedDays = Number(targetDaysInput);
    const targetDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : null;

    const unitsCanBuy = money / Math.max(1, tariff);
    const estimatedDaysMoneyLasts = currentDailyUsageKwh > 0 ? unitsCanBuy / currentDailyUsageKwh : 0;

    const allowedDailyKwh = targetDays ? unitsCanBuy / targetDays : currentDailyUsageKwh;

    if (plannerAppliances.length === 0) {
      setResult({
        allowedDailyKwh,
        rows: [],
        plannedDailyKwh: 0,
        feasible: false,
        estimatedDaysMoneyLasts,
      });
      return;
    }

    const essentials = plannerAppliances.map((item) => {
      const lower = item.name.toLowerCase();
      const essential = lower.includes("fridge") || lower.includes("light") || lower.includes("router") || lower.includes("fan");

      return {
        ...item,
        baseHours: Math.max(0, Math.min(24, Number(item.hoursPerDay || 1))),
        essential,
      };
    });

    const modeMinFactor = {
      comfort: { essential: 0.8, nonEssential: 0.45 },
      balanced: { essential: 0.65, nonEssential: 0.3 },
      survival: { essential: 0.45, nonEssential: 0.1 },
    }[mode];

    const mins = essentials.map((item) => {
      const factor = item.essential ? modeMinFactor.essential : modeMinFactor.nonEssential;
      return { ...item, minHours: item.baseHours * factor };
    });

    const minDailyKwh = mins.reduce((sum, item) => sum + (item.power * item.minHours) / 1000, 0);

    let rows: Array<{ name: string; recommendedHours: number; dailyKwh: number; dailyCost: number; note: string }> = [];

    if (allowedDailyKwh <= 0) {
      rows = mins.map((item) => ({
        name: item.name,
        recommendedHours: 0,
        dailyKwh: 0,
        dailyCost: 0,
        note: "No budget",
      }));
    } else if (allowedDailyKwh < minDailyKwh) {
      const factor = allowedDailyKwh / Math.max(minDailyKwh, 0.0001);
      rows = mins.map((item) => {
        const recommendedHours = item.minHours * factor;
        const dailyKwh = (item.power * recommendedHours) / 1000;
        return {
          name: item.name,
          recommendedHours,
          dailyKwh,
          dailyCost: dailyKwh * tariff,
          note: "Below preferred minimum",
        };
      });
    } else {
      const extraBudget = allowedDailyKwh - minDailyKwh;
      const extraPotentialKwh = mins.reduce((sum, item) => sum + (item.power * (item.baseHours - item.minHours)) / 1000, 0);

      rows = mins.map((item) => {
        const itemPotentialKwh = (item.power * (item.baseHours - item.minHours)) / 1000;
        const share = extraPotentialKwh > 0 ? itemPotentialKwh / extraPotentialKwh : 0;
        const extraKwh = extraBudget * share;
        const extraHours = item.power > 0 ? (extraKwh * 1000) / item.power : 0;

        const recommendedHours = Math.min(item.baseHours, item.minHours + extraHours);
        const dailyKwh = (item.power * recommendedHours) / 1000;

        return {
          name: item.name,
          recommendedHours,
          dailyKwh,
          dailyCost: dailyKwh * tariff,
          note: recommendedHours >= item.baseHours - 0.05 ? "Full routine" : "Reduced routine",
        };
      });
    }

    const plannedDailyKwh = rows.reduce((sum, item) => sum + item.dailyKwh, 0);
    setResult({
      allowedDailyKwh,
      rows,
      plannedDailyKwh,
      feasible: plannedDailyKwh <= allowedDailyKwh + 0.01,
      estimatedDaysMoneyLasts,
    });
  }

  function downloadMoneyPlannerPdf() {
    if (!result) return;

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
      doc.text("Money Planner Report", 14, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 11, { align: "right" });
      doc.text(`Tariff: ${tariff}`, pageWidth - 14, 19, { align: "right" });
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
        { label: "Budget", value: `UGX ${Math.round(money).toLocaleString()}` },
        { label: "Estimated Days", value: `${result.estimatedDaysMoneyLasts.toFixed(1)} days` },
        { label: "Allowed Daily", value: `${result.allowedDailyKwh.toFixed(2)} kWh` },
        { label: "Planned Daily", value: `${result.plannedDailyKwh.toFixed(2)} kWh` },
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

    const renderTableHeader = (yStart: number) => {
      doc.setFillColor(...theme.navy);
      doc.rect(14, yStart, pageWidth - 28, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Appliance", 16, yStart + 5.5);
      doc.text("Hours/day", 82, yStart + 5.5);
      doc.text("Daily Usage", 112, yStart + 5.5);
      doc.text("Daily Cost", pageWidth - 16, yStart + 5.5, { align: "right" });
      doc.setTextColor(...theme.text);
      return yStart + 11;
    };

    renderHeader();
    let y = renderSummary(headerBottom);
    y = renderTableHeader(y);

    let rowIndex = 0;
    result.rows.forEach((row) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        renderHeader();
        y = renderTableHeader(headerBottom);
      }

      if (rowIndex % 2 === 0) {
        doc.setFillColor(...theme.light);
        doc.rect(14, y - 4.5, pageWidth - 28, 7, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(row.name.slice(0, 28), 16, y);
      doc.text(`${row.recommendedHours.toFixed(2)}h`, 82, y);
      doc.text(`${row.dailyKwh.toFixed(2)} kWh`, 112, y);
      doc.text(`UGX ${Math.round(row.dailyCost).toLocaleString()}`, pageWidth - 16, y, { align: "right" });

      y += 7.5;
      rowIndex += 1;
    });

    renderFooter();

    doc.save(`openergy-money-planner-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-black">Budget Module</p>
              <h1 className="page-title mt-2">Money Planner</h1>
              <p className="page-subtitle mt-2">Add appliances, optionally set target days, then calculate planning results.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadMoneyPlannerPdf}
                disabled={!result}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
              >
                Download PDF
              </button>
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <section className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Budget Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Money (UGX)
              <input
                type="number"
                min={0}
                value={money}
                onChange={(e) => setMoney(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Tariff
              <input
                type="number"
                min={1}
                value={tariff}
                onChange={(e) => setTariff(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Target Days (Optional)
              <input
                type="number"
                min={1}
                placeholder="Optional"
                value={targetDaysInput}
                onChange={(e) => setTargetDaysInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              />
            </label>
          </div>

          <label className="text-sm font-semibold text-slate-700 block max-w-xs">
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PlanMode)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              <option value="comfort">Comfort</option>
              <option value="balanced">Balanced</option>
              <option value="survival">Survival</option>
            </select>
          </label>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h2 className="text-lg font-black text-slate-900">Add Appliances</h2>
            <select
              onChange={(e) => {
                if (e.target.value) addAppliance(Number(e.target.value));
                e.target.value = "";
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              <option value="">Add appliance</option>
              {availableAppliances.map((item, idx) => (
                <option key={`${item.name}-${idx}`} value={idx}>
                  {item.name} ({item.power}W, avg {Number(item.hoursPerDay || 1)}h/day)
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plannerAppliances.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.power}W</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.1}
                      value={item.hoursPerDay}
                      onChange={(e) => updateHours(item.id, Number(e.target.value))}
                      className="w-24 rounded-lg border border-slate-200 bg-white p-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePlannerAppliance(item.id)}
                      className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-bold text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={calculatePlan}
              className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Calculate Results
            </button>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="text-lg font-black text-slate-900">Use Created Lists</h2>
            {applianceLists.length === 0 ? (
              <p className="text-sm text-slate-500">No created lists found.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {applianceLists.map((list) => (
                  <div key={list.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{list.name}</p>
                      <p className="text-xs text-slate-600">{list.appliances.length} appliances</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadListIntoPlanner(list)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Use List
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Planning Results</h2>

          {!result ? (
            <p className="text-sm text-slate-500">Click &quot;Calculate Results&quot; after configuring appliances and budget.</p>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                Estimated days money lasts: <span className="font-black">{result.estimatedDaysMoneyLasts.toFixed(1)} days</span> · Allowed daily: <span className="font-black">{result.allowedDailyKwh.toFixed(2)} kWh</span> · Planned daily: <span className="font-black">{result.plannedDailyKwh.toFixed(2)} kWh</span> · {result.feasible ? "Feasible" : "Not fully feasible"}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-1.5">Appliance</th>
                      <th className="py-1.5">Recommended Hours</th>
                      <th className="py-1.5">Daily kWh</th>
                      <th className="py-1.5">Daily Cost</th>
                      <th className="py-1.5">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.name} className="border-b border-slate-100 text-slate-700">
                        <td className="py-1.5">{row.name}</td>
                        <td className="py-1.5">{row.recommendedHours.toFixed(2)}h</td>
                        <td className="py-1.5">{row.dailyKwh.toFixed(2)}</td>
                        <td className="py-1.5">UGX {Math.round(row.dailyCost).toLocaleString()}</td>
                        <td className="py-1.5">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
