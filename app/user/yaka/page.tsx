"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";

type Appliance = { name: string; power: number; hoursPerDay?: number };
type SelectedAppliance = { id: string; name: string; power: number; hoursPerDay: number };
type SavedAppliance = { name: string; power: number; hoursPerDay: number };
type ApplianceList = { id: string; name: string; createdAt: string; appliances: SavedAppliance[] };
type CalculationHistoryEntry = {
  id: string;
  createdAt: string;
  durationValue: number;
  durationUnit: string;
  days: number;
  tariff: number;
  appliances: SavedAppliance[];
  totals: { dailyKwh: number; periodKwh: number; estimatedCost: number };
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const DURATION_MULTIPLIER: Record<string, number> = {
  days: 1,
  weeks: 7,
  months: 30,
};

const DEFAULT_TARIFF = 805;

export default function YakaPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";

  const [apiAppliances, setApiAppliances] = useState<Appliance[]>([]);
  const [customAppliances, setCustomAppliances] = useState<Appliance[]>([]);
  const [selected, setSelected] = useState<SelectedAppliance[]>([]);
  const [durationValue, setDurationValue] = useState<number>(7);
  const [durationUnit, setDurationUnit] = useState<string>("days");
  const [tariff, setTariff] = useState<number>(DEFAULT_TARIFF);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [history, setHistory] = useState<CalculationHistoryEntry[]>([]);
  const [applianceLists, setApplianceLists] = useState<ApplianceList[]>([]);
  const [listName, setListName] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");

  const historyStorageKey = `openergy:yaka:history:${userKey}`;
  const listsStorageKey = `openergy:yaka:lists:${userKey}`;
  const customAppliancesKey = `openergy:custom-appliances:${userKey}`;

  const availableAppliances = useMemo(() => {
    const merged = [...apiAppliances, ...customAppliances];
    const unique = new Map<string, Appliance>();

    for (const appliance of merged) {
      const key = appliance.name.trim().toLowerCase();
      if (!key) continue;
      if (!unique.has(key)) {
        unique.set(key, {
          name: appliance.name,
          power: Number(appliance.power),
          hoursPerDay: Number(appliance.hoursPerDay || 1),
        });
      }
    }

    return Array.from(unique.values());
  }, [apiAppliances, customAppliances]);

  useEffect(() => {
    fetch("/api/user/appliances")
      .then((r) => r.json())
      .then((d) => setApiAppliances(Array.isArray(d.appliances) ? d.appliances : []));

    fetch("/api/user/appliances/save")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.appliances) && d.appliances.length > 0) {
          setSelected(
            d.appliances.map((app: Appliance, index: number) => ({
              id: `${app.name}-${index}-${Date.now()}`,
              name: app.name,
              power: Number(app.power),
              hoursPerDay: Number(app.hoursPerDay || 0),
            }))
          );
          setSaveStatus("saved");
        }
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frameId = window.requestAnimationFrame(() => {
      const rawHistory = window.localStorage.getItem(historyStorageKey);
      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory) as CalculationHistoryEntry[];
          setHistory(Array.isArray(parsed) ? parsed : []);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }

      const rawLists = window.localStorage.getItem(listsStorageKey);
      if (rawLists) {
        try {
          const parsed = JSON.parse(rawLists) as ApplianceList[];
          setApplianceLists(Array.isArray(parsed) ? parsed : []);
        } catch {
          setApplianceLists([]);
        }
      } else {
        setApplianceLists([]);
      }

      const rawCustomAppliances = window.localStorage.getItem(customAppliancesKey);
      if (rawCustomAppliances) {
        try {
          const parsed = JSON.parse(rawCustomAppliances) as Appliance[];
          setCustomAppliances(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCustomAppliances([]);
        }
      } else {
        setCustomAppliances([]);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [historyStorageKey, listsStorageKey, customAppliancesKey]);

  const days = Math.max(1, durationValue) * (DURATION_MULTIPLIER[durationUnit] || 1);

  const totals = useMemo(() => {
    const dailyKwh = selected.reduce((acc, app) => {
      const hours = Number.isFinite(app.hoursPerDay) ? app.hoursPerDay : 0;
      return acc + (app.power * Math.max(0, Math.min(24, hours))) / 1000;
    }, 0);

    const periodKwh = dailyKwh * days;
    const estimatedCost = periodKwh * Math.max(0, tariff);

    return {
      dailyKwh,
      periodKwh,
      estimatedCost,
    };
  }, [selected, days, tariff]);

  const hasInvalidHours = selected.some((app) => app.hoursPerDay < 0 || app.hoursPerDay > 24);

  function markDirty() {
    setSaveStatus((prev) => (prev === "saving" ? prev : "dirty"));
  }

  function addAppliance(index: number) {
    const app = availableAppliances[index];
    if (!app) return;

    setSelected((prev) => [
      ...prev,
      {
        id: `${app.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: app.name,
        power: Number(app.power),
        hoursPerDay: Number(app.hoursPerDay || 1),
      },
    ]);
    markDirty();
  }

  function addCustom(name: string, power: number) {
    setSelected((prev) => [
      ...prev,
      {
        id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        power,
        hoursPerDay: 1,
      },
    ]);
    markDirty();
  }

  function updateHours(id: string, hours: number) {
    setSelected((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              hoursPerDay: Number.isFinite(hours) ? hours : 0,
            }
          : app
      )
    );
    markDirty();
  }

  function removeAppliance(id: string) {
    setSelected((prev) => prev.filter((app) => app.id !== id));
    markDirty();
  }

  async function saveToDatabase() {
    if (hasInvalidHours) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/user/appliances/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliances: selected }),
      });

      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  function saveCalculationToHistory() {
    if (hasInvalidHours || selected.length === 0 || typeof window === "undefined") {
      setHistoryMessage("Add valid appliance usage first.");
      return;
    }

    const entry: CalculationHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      durationValue,
      durationUnit,
      days,
      tariff,
      appliances: selected.map((item) => ({
        name: item.name,
        power: item.power,
        hoursPerDay: item.hoursPerDay,
      })),
      totals,
    };

    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    window.localStorage.setItem(historyStorageKey, JSON.stringify(next));
    setHistoryMessage("Calculation saved to history.");
  }

  function applyHistoryEntry(entry: CalculationHistoryEntry) {
    setSelected(
      entry.appliances.map((app, index) => ({
        id: `${app.name}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: app.name,
        power: Number(app.power),
        hoursPerDay: Number(app.hoursPerDay || 0),
      }))
    );
    setDurationValue(entry.durationValue);
    setDurationUnit(entry.durationUnit);
    setTariff(entry.tariff);
    setHistoryMessage("Loaded selected history item into calculator.");
    markDirty();
  }

  function clearHistory() {
    if (typeof window === "undefined") return;
    setHistory([]);
    window.localStorage.removeItem(historyStorageKey);
    setHistoryMessage("History cleared.");
  }

  function saveApplianceList() {
    if (!listName.trim() || selected.length === 0 || typeof window === "undefined") return;

    const newList: ApplianceList = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: listName.trim(),
      createdAt: new Date().toISOString(),
      appliances: selected.map((item) => ({
        name: item.name,
        power: item.power,
        hoursPerDay: item.hoursPerDay,
      })),
    };

    const next = [newList, ...applianceLists].slice(0, 15);
    setApplianceLists(next);
    setListName("");
    window.localStorage.setItem(listsStorageKey, JSON.stringify(next));
  }

  function loadApplianceList(list: ApplianceList) {
    setSelected(
      list.appliances.map((app, index) => ({
        id: `${app.name}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: app.name,
        power: Number(app.power),
        hoursPerDay: Number(app.hoursPerDay || 0),
      }))
    );
    markDirty();
  }

  function deleteApplianceList(id: string) {
    if (typeof window === "undefined") return;
    const next = applianceLists.filter((item) => item.id !== id);
    setApplianceLists(next);
    window.localStorage.setItem(listsStorageKey, JSON.stringify(next));
  }

  function downloadCurrentResultsPdf() {
    if (selected.length === 0) {
      setHistoryMessage("Add appliances before downloading the PDF report.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 34, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("OP Energy - Yaka Usage Report", 14, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);
    doc.text(`Duration: ${durationValue} ${durationUnit} (${days} day${days > 1 ? "s" : ""})`, 14, 27);
    doc.text(`Tariff: UGX ${tariff.toLocaleString()} / unit`, pageWidth - 14, 27, { align: "right" });

    doc.setTextColor(15, 23, 42);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(14, 40, pageWidth - 28, 24, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Daily Usage", 18, 48);
    doc.text("Period Usage", 72, 48);
    doc.text("Estimated Cost", 128, 48);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${totals.dailyKwh.toFixed(2)} kWh`, 18, 56);
    doc.text(`${totals.periodKwh.toFixed(2)} units`, 72, 56);
    doc.text(`UGX ${Math.round(totals.estimatedCost).toLocaleString()}`, 128, 56);

    let y = 72;

    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, pageWidth - 28, 9, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Appliance", 16, y + 6);
    doc.text("Power", 72, y + 6);
    doc.text("Hours/day", 94, y + 6);
    doc.text("Usage", 120, y + 6);
    doc.text("Cost", pageWidth - 16, y + 6, { align: "right" });

    y += 11;
    doc.setTextColor(15, 23, 42);

    for (const item of selected) {
      const dailyKwh = (item.power * Math.max(0, Math.min(24, item.hoursPerDay))) / 1000;
      const periodKwh = dailyKwh * days;
      const cost = periodKwh * tariff;

      if (y > pageHeight - 16) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(item.name.slice(0, 26), 16, y);
      doc.text(`${item.power}W`, 72, y);
      doc.text(item.hoursPerDay.toFixed(1), 96, y);
      doc.text(`${periodKwh.toFixed(2)} kWh`, 120, y);
      doc.text(`UGX ${Math.round(cost).toLocaleString()}`, pageWidth - 16, y, { align: "right" });

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 2, pageWidth - 14, y + 2);
      y += 7;
    }

    const filename = `openergy-yaka-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  return (
    <div className="page-shell">
      <div className="page-container space-y-6">
        <header className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">Energy Planner</p>
              <h1 className="page-title mt-2">Yaka Usage Calculator</h1>
              <p className="page-subtitle mt-2">
                Build your appliance mix, set daily usage hours, and get live unit and cost estimates.
              </p>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="card p-6 space-y-6">
            <div>
              <h2 className="font-black text-lg text-slate-900">Add Appliance</h2>
              <select
                onChange={(e) => {
                  if (e.target.value) addAppliance(Number(e.target.value));
                  e.target.value = "";
                }}
                className="mt-3 w-full p-3 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="">Select from common appliances</option>
                {availableAppliances.map((a, i) => (
                  <option key={`${a.name}-${i}`} value={i}>
                    {a.name} ({a.power}W, avg {Number(a.hoursPerDay || 1)}h/day)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Custom Appliance</h3>
              <CustomAdd onAdd={addCustom} />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Appliance Lists</h3>
              <div className="flex gap-2">
                <input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="List name (e.g. Weekend Setup)"
                  className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50"
                />
                <button
                  type="button"
                  onClick={saveApplianceList}
                  className="px-4 rounded-xl bg-slate-900 text-white text-sm font-bold"
                >
                  Save List
                </button>
              </div>

              {applianceLists.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {applianceLists.map((list) => (
                    <div key={list.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{list.name}</p>
                        <p className="text-xs text-slate-500">{list.appliances.length} appliances</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadApplianceList(list)}
                          className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-600 text-white"
                        >
                          Use List
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteApplianceList(list.id)}
                          className="text-xs font-bold px-2 py-1 rounded-lg bg-red-50 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition-colors disabled:opacity-70"
                onClick={saveToDatabase}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? "Saving..." : "Save List to Profile"}
              </button>
              <SaveStatusBanner saveStatus={saveStatus} hasInvalidHours={hasInvalidHours} />
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="font-black text-lg text-slate-900">Current Configuration</h2>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selected.length === 0 ? (
                <p className="text-slate-500 italic">No appliances added yet.</p>
              ) : (
                selected.map((item) => {
                  const invalidHours = item.hoursPerDay < 0 || item.hoursPerDay > 24;
                  const dailyKwh = (item.power * Math.max(0, Math.min(24, item.hoursPerDay))) / 1000;

                  return (
                    <div key={item.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.power}W appliance rating</p>
                        </div>
                        <button
                          onClick={() => removeAppliance(item.id)}
                          className="text-red-600 text-sm font-bold hover:bg-red-50 px-2 py-1 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-end">
                        <label className="text-xs font-semibold text-slate-600">
                          Hours per day
                          <input
                            type="number"
                            min={0}
                            max={24}
                            value={Number.isFinite(item.hoursPerDay) ? item.hoursPerDay : ""}
                            onChange={(e) => updateHours(item.id, Number(e.target.value))}
                            className={`mt-1 w-full p-2 rounded-lg border bg-white ${
                              invalidHours ? "border-red-300" : "border-slate-200"
                            }`}
                          />
                        </label>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Daily subtotal</p>
                          <p className="text-base font-black text-slate-900">{dailyKwh.toFixed(2)} kWh</p>
                        </div>
                      </div>

                      {invalidHours && (
                        <p className="text-xs text-red-700 font-semibold">Hours must be between 0 and 24.</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="card p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Duration value
              <input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
                className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Duration unit
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Tariff (UGX per unit)
              <input
                type="number"
                min={0}
                value={tariff}
                onChange={(e) => setTariff(Math.max(0, Number(e.target.value) || 0))}
                className="mt-2 w-full p-3 rounded-xl border border-slate-200 bg-slate-50"
              />
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Daily Usage" value={`${totals.dailyKwh.toFixed(2)} kWh`} />
            <MetricCard label={`Usage for ${days} day${days > 1 ? "s" : ""}`} value={`${totals.periodKwh.toFixed(2)} units`} />
            <MetricCard label="Estimated Cost" value={`UGX ${Math.round(totals.estimatedCost).toLocaleString()}`} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveCalculationToHistory}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-bold"
            >
              Save Result to History
            </button>
            <button
              type="button"
              onClick={downloadCurrentResultsPdf}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-bold"
            >
              Download Results (PDF)
            </button>
          </div>

          {historyMessage && <p className="mt-3 text-sm font-semibold text-slate-700">{historyMessage}</p>}
        </section>

        <section className="card p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-black text-lg text-slate-900">Calculation History</h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
              >
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">No history yet. Save a calculation result to keep a record.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(entry.createdAt).toLocaleString()} · {entry.appliances.length} appliances · Tariff UGX {entry.tariff}
                    </p>
                    <button
                      type="button"
                      onClick={() => applyHistoryEntry(entry)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Use Again
                    </button>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-1">Appliance</th>
                          <th className="py-1">Power</th>
                          <th className="py-1">Hours/day</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.appliances.map((item, idx) => (
                          <tr key={`${entry.id}-${idx}`} className="border-t border-slate-200 text-slate-700">
                            <td className="py-1.5">{item.name}</td>
                            <td className="py-1.5">{item.power}W</td>
                            <td className="py-1.5">{item.hoursPerDay}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Power used: {entry.totals.periodKwh.toFixed(2)} units in {entry.days} days · Amount: UGX {Math.round(entry.totals.estimatedCost).toLocaleString()}
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

function SaveStatusBanner({ saveStatus, hasInvalidHours }: { saveStatus: SaveStatus; hasInvalidHours: boolean }) {
  if (hasInvalidHours) {
    return <p className="text-sm font-semibold text-red-700">Fix invalid hours before saving.</p>;
  }

  if (saveStatus === "dirty") {
    return <p className="text-sm font-semibold text-amber-700">Unsaved changes.</p>;
  }

  if (saveStatus === "saved") {
    return <p className="text-sm font-semibold text-green-700">Saved to profile.</p>;
  }

  if (saveStatus === "error") {
    return <p className="text-sm font-semibold text-red-700">Could not save. Try again.</p>;
  }

  return <p className="text-sm font-semibold text-slate-500">Save your latest appliance plan to your profile.</p>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-black">{label}</p>
      <p className="text-xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function CustomAdd({ onAdd }: { onAdd: (name: string, power: number) => void }) {
  const [name, setName] = useState("");
  const [power, setPower] = useState("");

  return (
    <form
      className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        const parsedPower = Number(power);

        if (!trimmed || !Number.isFinite(parsedPower) || parsedPower <= 0) return;

        onAdd(trimmed, parsedPower);
        setName("");
        setPower("");
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Appliance name"
        className="p-3 border border-slate-200 rounded-xl bg-slate-50 sm:col-span-2"
      />
      <input
        value={power}
        onChange={(e) => setPower(e.target.value)}
        placeholder="Power (W)"
        type="number"
        min={1}
        className="p-3 border border-slate-200 rounded-xl bg-slate-50"
      />
      <button
        type="submit"
        className="sm:col-span-3 bg-slate-900 hover:bg-black text-white font-bold p-3 rounded-xl transition-colors"
      >
        Add Custom Appliance
      </button>
    </form>
  );
}
