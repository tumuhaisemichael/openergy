"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Appliance = {
  name: string;
  power: number;
  hoursPerDay?: number;
};

type ApplianceList = {
  id: string;
  name: string;
  createdAt: string;
  appliances: Array<{ name: string; power: number; hoursPerDay: number }>;
};

export default function AppliancesPage() {
  const { data: session } = useSession();
  const userKey = session?.user?.id || "anonymous";
  const listsStorageKey = `openergy:yaka:lists:${userKey}`;
  const customAppliancesKey = `openergy:custom-appliances:${userKey}`;

  const [defaultAppliances, setDefaultAppliances] = useState<Appliance[]>([]);
  const [customAppliances, setCustomAppliances] = useState<Appliance[]>([]);
  const [applianceLists, setApplianceLists] = useState<ApplianceList[]>([]);

  const [name, setName] = useState("");
  const [power, setPower] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [newListName, setNewListName] = useState("");
  const [draftListItems, setDraftListItems] = useState<Array<{ id: string; name: string; power: number; hoursPerDay: number }>>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch("/api/user/appliances");
        const data = await res.json();
        if (active) setDefaultAppliances(Array.isArray(data.appliances) ? data.appliances : []);
      } catch {
        if (active) setDefaultAppliances([]);
      }

      if (typeof window !== "undefined") {
        const rawLists = window.localStorage.getItem(listsStorageKey);
        if (rawLists) {
          try {
            const parsed = JSON.parse(rawLists) as ApplianceList[];
            if (active) setApplianceLists(Array.isArray(parsed) ? parsed : []);
          } catch {
            if (active) setApplianceLists([]);
          }
        } else if (active) {
          setApplianceLists([]);
        }

        const rawCustom = window.localStorage.getItem(customAppliancesKey);
        if (rawCustom) {
          try {
            const parsed = JSON.parse(rawCustom) as Appliance[];
            if (active) setCustomAppliances(Array.isArray(parsed) ? parsed : []);
          } catch {
            if (active) setCustomAppliances([]);
          }
        } else if (active) {
          setCustomAppliances([]);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [listsStorageKey, customAppliancesKey]);

  const allAppliances = useMemo(() => {
    return [...customAppliances, ...defaultAppliances];
  }, [customAppliances, defaultAppliances]);

  function saveCustomAppliances(next: Appliance[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(customAppliancesKey, JSON.stringify(next));
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const parsedPower = Number(power);
    const parsedHours = Number(hoursPerDay);

    if (!trimmedName || !Number.isFinite(parsedPower) || parsedPower <= 0) return;

    const appliance: Appliance = {
      name: trimmedName,
      power: parsedPower,
      hoursPerDay: Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : 1,
    };

    const deduped = customAppliances.filter((item) => item.name.trim().toLowerCase() !== trimmedName.toLowerCase());
    const next = [appliance, ...deduped];

    setCustomAppliances(next);
    saveCustomAppliances(next);

    setName("");
    setPower("");
    setHoursPerDay("");
  }

  function removeCustomAppliance(nameToRemove: string) {
    const next = customAppliances.filter((item) => item.name !== nameToRemove);
    setCustomAppliances(next);
    saveCustomAppliances(next);
  }

  function addApplianceToDraft(index: number) {
    const appliance = allAppliances[index];
    if (!appliance) return;

    setDraftListItems((prev) => [
      ...prev,
      {
        id: `${appliance.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: appliance.name,
        power: Number(appliance.power),
        hoursPerDay: Number(appliance.hoursPerDay || 1),
      },
    ]);
  }

  function updateDraftHours(id: string, hours: number) {
    setDraftListItems((prev) =>
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

  function removeDraftItem(id: string) {
    setDraftListItems((prev) => prev.filter((item) => item.id !== id));
  }

  function saveNewApplianceList() {
    if (!newListName.trim() || draftListItems.length === 0 || typeof window === "undefined") return;

    const newList: ApplianceList = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: newListName.trim(),
      createdAt: new Date().toISOString(),
      appliances: draftListItems.map((item) => ({
        name: item.name,
        power: item.power,
        hoursPerDay: item.hoursPerDay,
      })),
    };

    const next = [newList, ...applianceLists].slice(0, 20);
    setApplianceLists(next);
    window.localStorage.setItem(listsStorageKey, JSON.stringify(next));
    setNewListName("");
    setDraftListItems([]);
  }

  function deleteApplianceList(id: string) {
    if (typeof window === "undefined") return;
    const next = applianceLists.filter((list) => list.id !== id);
    setApplianceLists(next);
    window.localStorage.setItem(listsStorageKey, JSON.stringify(next));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-white rounded shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Appliances</h1>
              <p className="text-sm text-slate-600 mt-1">Create appliances here and they will appear in the calculator list.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/user/yaka" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Open Calculator
              </Link>
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-black text-slate-900">Create Appliance</h2>
          <form onSubmit={handleAddCustom} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Appliance name"
              className="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50"
            />
            <input
              value={power}
              onChange={(e) => setPower(e.target.value)}
              placeholder="Power (W)"
              type="number"
              min={1}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50"
            />
            <input
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              placeholder="Avg hours/day"
              type="number"
              min={0.1}
              step={0.1}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50"
            />
            <button className="md:col-span-4 rounded-xl bg-slate-900 text-white font-bold px-4 py-3 hover:bg-black">
              Save Appliance
            </button>
          </form>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-black text-slate-900">Available Appliances</h2>
          <p className="text-sm text-slate-600 mt-1">Includes default appliances and your custom appliances.</p>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {allAppliances.map((a, i) => {
              const isCustom = customAppliances.some((item) => item.name === a.name);
              return (
                <li key={`${a.name}-${i}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-600">
                      {a.power}W · Avg {Number(a.hoursPerDay || 1)}h/day {isCustom ? "· Custom" : "· Default"}
                    </p>
                  </div>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomAppliance(a.name)}
                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-black text-slate-900">Created Appliance Lists</h2>
          <p className="text-sm text-slate-600 mt-1">These are the lists saved from the calculator.</p>

          <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3">
            <p className="text-sm font-black text-slate-900">Create New List</p>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name (e.g. Evening Setup)"
                className="flex-1 p-3 rounded-xl border border-slate-200 bg-white"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) addApplianceToDraft(Number(e.target.value));
                  e.target.value = "";
                }}
                className="md:w-80 p-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Add appliance to list</option>
                {allAppliances.map((item, idx) => (
                  <option key={`${item.name}-${idx}`} value={idx}>
                    {item.name} ({item.power}W, avg {Number(item.hoursPerDay || 1)}h/day)
                  </option>
                ))}
              </select>
            </div>

            {draftListItems.length > 0 && (
              <div className="space-y-2">
                {draftListItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-600">{item.power}W</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.1}
                        value={item.hoursPerDay}
                        onChange={(e) => updateDraftHours(item.id, Number(e.target.value))}
                        className="w-24 p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeDraftItem(item.id)}
                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={saveNewApplianceList}
              className="rounded-xl bg-slate-900 text-white font-bold px-4 py-2.5 hover:bg-black"
            >
              Save Appliance List
            </button>
          </div>

          {applianceLists.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No appliance lists created yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {applianceLists.map((list) => (
                <div key={list.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{list.name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {list.appliances.length} appliances · {new Date(list.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteApplianceList(list.id)}
                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700"
                    >
                      Delete
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
                        {list.appliances.map((item, idx) => (
                          <tr key={`${list.id}-${idx}`} className="border-t border-slate-200 text-slate-700">
                            <td className="py-1.5">{item.name}</td>
                            <td className="py-1.5">{item.power}W</td>
                            <td className="py-1.5">{item.hoursPerDay}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
