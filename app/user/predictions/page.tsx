"use client";

import Link from "next/link";
import HelpOverlay from "@/app/components/HelpOverlay";
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

type Appliance = { name: string; power: number; hoursPerDay?: number };

type ApplianceList = {
  id: string;
  name: string;
  createdAt: string;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
};

type EditableMonthPlan = {
  month: number;
  appliances: Array<{ id: string; name: string; power: number; hoursPerDay: number }>;
};

const helpContent = {
  title: "Monthly Predictions",
  description:
    "Forecast how your appliance usage affects monthly units and cost, and adjust future months to see changes instantly.",
  howTo: [
    "Select a baseline from history or a saved appliance list.",
    "Set the number of months and growth rate to model changes.",
    "Adjust appliance hours for each month to explore scenarios.",
  ],
  results: [
    "Month-by-month kWh and UGX projections.",
    "A clear view of how usage changes affect spend.",
    "Exportable prediction reports in PDF format.",
  ],
};

export default function PredictionsPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const historyStorageKey = `openergy:yaka:history:${userKey}`;
  const listsStorageKey = `openergy:yaka:lists:${userKey}`;
  const customAppliancesKey = `openergy:custom-appliances:${userKey}`;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");

  const [availableAppliances, setAvailableAppliances] = useState<Appliance[]>([]);
  const [applianceLists, setApplianceLists] = useState<ApplianceList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");

  const [months, setMonths] = useState(6);
  const [monthlyGrowthPct, setMonthlyGrowthPct] = useState(2);
  const [monthPlans, setMonthPlans] = useState<EditableMonthPlan[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      let defaults: Appliance[] = [];
      try {
        const defaultRes = await fetch("/api/user/appliances");
        const defaultJson = await defaultRes.json();
        defaults = Array.isArray(defaultJson.appliances) ? defaultJson.appliances : [];
      } catch {
        defaults = [];
      }

      if (typeof window === "undefined") return;

      const frameId = window.requestAnimationFrame(() => {
        const rawHistory = window.localStorage.getItem(historyStorageKey);
        let historyRows: HistoryEntry[] = [];
        if (rawHistory) {
          try {
            const parsed = JSON.parse(rawHistory) as HistoryEntry[];
            historyRows = Array.isArray(parsed) ? parsed : [];
          } catch {
            historyRows = [];
          }
        }

        const rawLists = window.localStorage.getItem(listsStorageKey);
        let listRows: ApplianceList[] = [];
        if (rawLists) {
          try {
            const parsed = JSON.parse(rawLists) as ApplianceList[];
            listRows = Array.isArray(parsed) ? parsed : [];
          } catch {
            listRows = [];
          }
        }

        const rawCustom = window.localStorage.getItem(customAppliancesKey);
        let customRows: Appliance[] = [];
        if (rawCustom) {
          try {
            const parsed = JSON.parse(rawCustom) as Appliance[];
            customRows = Array.isArray(parsed) ? parsed : [];
          } catch {
            customRows = [];
          }
        }

        const merged = [...customRows, ...defaults];
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
          setHistory(historyRows);
          if (historyRows[0]?.id) setSelectedHistoryId(historyRows[0].id);
          setApplianceLists(listRows);
          setAvailableAppliances(Array.from(unique.values()));
        }
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [historyStorageKey, listsStorageKey, customAppliancesKey]);

  const selectedHistory = useMemo(
    () => history.find((item) => item.id === selectedHistoryId) || history[0],
    [history, selectedHistoryId]
  );

  const selectedList = useMemo(
    () => applianceLists.find((list) => list.id === selectedListId) || null,
    [applianceLists, selectedListId]
  );

  const activeTariff = selectedHistory?.tariff || 805;

  const baselineAppliances = useMemo(() => {
    if (selectedList) {
      return selectedList.appliances.map((item) => ({
        name: item.name,
        power: Number(item.power),
        hoursPerDay: Number(item.hoursPerDay || 1),
      }));
    }

    if (selectedHistory?.appliances?.length) {
      return selectedHistory.appliances.map((item) => ({
        name: item.name,
        power: Number(item.power),
        hoursPerDay: Number(item.hoursPerDay || 1),
      }));
    }

    return [];
  }, [selectedHistory, selectedList]);

  useEffect(() => {
    const monthCount = Math.max(1, Math.min(24, months));
    const plans: EditableMonthPlan[] = Array.from({ length: monthCount }, (_, index) => {
      const growth = Math.pow(1 + monthlyGrowthPct / 100, index);
      return {
        month: index + 1,
        appliances: baselineAppliances.map((item, idx) => ({
          id: `m-${index}-${idx}-${Date.now()}`,
          name: item.name,
          power: Number(item.power),
          hoursPerDay: Math.max(0, Number(item.hoursPerDay || 1) * growth),
        })),
      };
    });

    if (typeof window === "undefined") return;
    const frameId = window.requestAnimationFrame(() => setMonthPlans(plans));
    return () => window.cancelAnimationFrame(frameId);
  }, [months, monthlyGrowthPct, baselineAppliances]);

  const monthlyResults = useMemo(() => {
    return monthPlans.map((month) => {
      const rows = month.appliances.map((item) => {
        const monthlyKwh = ((item.power * item.hoursPerDay) / 1000) * 30;
        const money = monthlyKwh * activeTariff;
        return {
          ...item,
          monthlyKwh,
          money,
        };
      });

      const totalKwh = rows.reduce((sum, item) => sum + item.monthlyKwh, 0);
      const totalMoney = rows.reduce((sum, item) => sum + item.money, 0);

      return {
        month: month.month,
        rows,
        totalKwh,
        totalMoney,
      };
    });
  }, [monthPlans, activeTariff]);

  function updateHours(monthNo: number, applianceId: string, hours: number) {
    setMonthPlans((prev) =>
      prev.map((month) =>
        month.month === monthNo
          ? {
              ...month,
              appliances: month.appliances.map((item) =>
                item.id === applianceId
                  ? {
                      ...item,
                      hoursPerDay: Number.isFinite(hours) ? Math.max(0, Math.min(24, hours)) : 0,
                    }
                  : item
              ),
            }
          : month
      )
    );
  }

  function removeAppliance(monthNo: number, applianceId: string) {
    setMonthPlans((prev) =>
      prev.map((month) =>
        month.month === monthNo
          ? {
              ...month,
              appliances: month.appliances.filter((item) => item.id !== applianceId),
            }
          : month
      )
    );
  }

  function addApplianceToMonth(monthNo: number, index: number) {
    const item = availableAppliances[index];
    if (!item) return;

    setMonthPlans((prev) =>
      prev.map((month) =>
        month.month === monthNo
          ? {
              ...month,
              appliances: [
                ...month.appliances,
                {
                  id: `month-${monthNo}-${item.name}-${Date.now()}`,
                  name: item.name,
                  power: Number(item.power),
                  hoursPerDay: Number(item.hoursPerDay || 1),
                },
              ],
            }
          : month
      )
    );
  }

  function addApplianceToBaseline(index: number) {
    const item = availableAppliances[index];
    if (!item) return;

    setMonthPlans((prev) =>
      prev.map((month) => ({
        ...month,
        appliances: [
          ...month.appliances,
          {
            id: `baseline-${month.month}-${item.name}-${Date.now()}`,
            name: item.name,
            power: Number(item.power),
            hoursPerDay: Number(item.hoursPerDay || 1),
          },
        ],
      }))
    );
  }

  function downloadPredictionsPdf() {
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
      doc.text("Monthly Predictions", 14, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 11, { align: "right" });
      doc.text(`Tariff: ${activeTariff}`, pageWidth - 14, 19, { align: "right" });
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

    const renderMonthHeader = (yStart: number, label: string) => {
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

    let y = headerBottom;
    monthlyResults.forEach((month) => {
      const monthLabel = `Month ${month.month} | ${month.totalKwh.toFixed(2)} kWh | UGX ${Math.round(month.totalMoney).toLocaleString()}`;
      if (y > pageHeight - 32) {
        doc.addPage();
        renderHeader();
        y = headerBottom;
      }

      y = renderMonthHeader(y, monthLabel);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      let rowIndex = 0;
      month.rows.forEach((item) => {
        if (y > pageHeight - 16) {
          doc.addPage();
          renderHeader();
          y = renderMonthHeader(headerBottom, monthLabel);
        }

        if (rowIndex % 2 === 0) {
          doc.setFillColor(...theme.light);
          doc.rect(14, y - 4, pageWidth - 28, 6.5, "F");
        }

        doc.text(
          `${item.name} | ${item.power}W | ${item.hoursPerDay.toFixed(2)}h/day | ${item.monthlyKwh.toFixed(2)}kWh | UGX ${Math.round(
            item.money
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

    doc.save(`openergy-predictions-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-black">Prediction Module</p>
              <h1 className="page-title mt-2">Monthly Predictions</h1>
              <p className="page-subtitle mt-2">
                Model future months, tweak appliance hours, and see projected kWh and cost change in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <HelpOverlay {...helpContent} />
              <button
                type="button"
                onClick={downloadPredictionsPdf}
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

        <section className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Baseline Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              History baseline
              <select
                value={selectedHistory?.id || ""}
                onChange={(e) => {
                  setSelectedHistoryId(e.target.value);
                  setSelectedListId("");
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              >
                {history.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {new Date(entry.createdAt).toLocaleString()} · {entry.days} days · UGX {Math.round(entry.totals.estimatedCost).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Or use appliance list
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              >
                <option value="">No list selected</option>
                {applianceLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.appliances.length} appliances)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Months to predict
              <input
                type="number"
                min={1}
                max={24}
                value={months}
                onChange={(e) => setMonths(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Monthly growth (%)
              <input
                type="number"
                min={-20}
                max={40}
                value={monthlyGrowthPct}
                onChange={(e) => setMonthlyGrowthPct(Math.max(-20, Math.min(40, Number(e.target.value) || 0)))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Add appliance to all months
              <select
                onChange={(e) => {
                  if (e.target.value) addApplianceToBaseline(Number(e.target.value));
                  e.target.value = "";
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              >
                <option value="">Select appliance</option>
                {availableAppliances.map((item, idx) => (
                  <option key={`${item.name}-${idx}`} value={idx}>
                    {item.name} ({item.power}W)
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {monthlyResults.length === 0 ? (
            <div className="card p-5 text-sm text-slate-500">No baseline data found for prediction.</div>
          ) : (
            monthlyResults.map((month) => (
              <div key={month.month} className="card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-900">Month {month.month}</h2>
                  <p className="text-sm font-bold text-slate-700">
                    Total: {month.totalKwh.toFixed(2)} kWh · UGX {Math.round(month.totalMoney).toLocaleString()}
                  </p>
                </div>

                <div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) addApplianceToMonth(month.month, Number(e.target.value));
                      e.target.value = "";
                    }}
                    className="w-full md:w-80 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <option value="">Add appliance to Month {month.month}</option>
                    {availableAppliances.map((item, idx) => (
                      <option key={`${month.month}-${item.name}-${idx}`} value={idx}>
                        {item.name} ({item.power}W)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-1.5">Appliance</th>
                        <th className="py-1.5">Power</th>
                        <th className="py-1.5">Hours/day</th>
                        <th className="py-1.5">Predicted kWh</th>
                        <th className="py-1.5">Predicted Money</th>
                        <th className="py-1.5">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {month.rows.map((item) => (
                        <tr key={`${month.month}-${item.id}`} className="border-b border-slate-100 text-slate-700">
                          <td className="py-1.5">{item.name}</td>
                          <td className="py-1.5">{item.power}W</td>
                          <td className="py-1.5">
                            <input
                              type="number"
                              min={0}
                              max={24}
                              step={0.1}
                              value={item.hoursPerDay}
                              onChange={(e) => updateHours(month.month, item.id, Number(e.target.value))}
                              className="w-24 rounded-lg border border-slate-200 bg-white p-1.5"
                            />
                          </td>
                          <td className="py-1.5">{item.monthlyKwh.toFixed(2)}</td>
                          <td className="py-1.5">UGX {Math.round(item.money).toLocaleString()}</td>
                          <td className="py-1.5">
                            <button
                              type="button"
                              onClick={() => removeAppliance(month.month, item.id)}
                              className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-bold text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
