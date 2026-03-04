"use client";

import React, { useEffect, useState } from "react";

type Appliance = { name: string; power: number };

export default function YakaPage() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [selected, setSelected] = useState<Appliance[]>([]);
  const [savedLists, setSavedLists] = useState<any[]>([]);
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<string>("days");
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    fetch("/api/user/appliances").then((r) => r.json()).then((d) => setAppliances(d.appliances || []));
    const lists = JSON.parse(localStorage.getItem("applianceLists") || "[]");
    setSavedLists(lists);
  }, []);

  function addAppliance(index: number) {
    const app = appliances[index];
    if (app) {
      setSelected((s) => [...s, app]);
    }
  }

  function addCustom(name: string, power: number) {
    setSelected((s) => [...s, { name, power }]);
  }

  function calculateUsage() {
    let totalW = 0;
    selected.forEach((appliance, idx) => {
      const hoursEl = document.getElementById(`hours-${idx}`) as HTMLInputElement | null;
      const hours = hoursEl ? parseFloat(hoursEl.value || "0") : 0;
      totalW += appliance.power * hours;
    });

    const days = durationUnit === "days" ? durationValue : durationUnit === "weeks" ? durationValue * 7 : durationValue * 30;
    const totalWh = totalW * days;
    // Assuming Yaka units: 1 unit = 1 kWh = 1000 Wh
    const yakaUnits = (totalWh / 1000).toFixed(2);
    setResult(`${yakaUnits} Yaka units for the selected period.`);
  }

  function saveList() {
    const lists = JSON.parse(localStorage.getItem("applianceLists") || "[]");
    lists.push(selected);
    localStorage.setItem("applianceLists", JSON.stringify(lists));
    setSavedLists(lists);
  }

  function loadSaved(index: number) {
    const lists = JSON.parse(localStorage.getItem("applianceLists") || "[]");
    setSelected(lists[index] || []);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Yaka Usage Calculator</h1>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Choose Appliance</h3>
            <select onChange={(e) => addAppliance(Number(e.target.value))} className="w-full p-2 border rounded">
              <option value="">-- select --</option>
              {appliances.map((a, i) => (
                <option key={i} value={i}>{a.name}</option>
              ))}
            </select>

            <h3 className="mt-4 font-semibold">Load Saved List</h3>
            <select onChange={(e) => loadSaved(Number(e.target.value))} className="w-full p-2 border rounded">
              <option value="">-- select --</option>
              {savedLists.map((_, i) => (
                <option key={i} value={i}>List {i + 1}</option>
              ))}
            </select>

            <h3 className="mt-4 font-semibold">Add Custom Appliance</h3>
            <CustomAdd onAdd={(n, p) => addCustom(n, p)} />
            <button className="mt-3 bg-blue-600 text-white p-2 rounded" onClick={saveList}>Save List</button>
          </div>

          <div>
            <h3 className="font-semibold">Selected Appliances</h3>
            <div>
              {selected.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b">
                  <div>{s.name} ({s.power}W)</div>
                  <input id={`hours-${i}`} type="number" placeholder="Hours/day" className="w-32 p-1 border rounded" />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label>Duration</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} className="p-2 border rounded w-24" />
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="p-2 border rounded">
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>

              <button className="mt-4 bg-green-600 text-white p-2 rounded" onClick={calculateUsage}>Calculate</button>
              {result && <div className="mt-3 p-3 bg-gray-100 rounded">{result}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomAdd({ onAdd }: { onAdd: (name: string, power: number) => void }) {
  const [name, setName] = useState("");
  const [power, setPower] = useState(0);
  return (
    <div>
      <input placeholder="Name" className="w-full mb-2 p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Power (W)" className="w-full mb-2 p-2 border rounded" value={power} onChange={(e) => setPower(Number(e.target.value))} />
      <button className="w-full bg-gray-200 p-2 rounded" onClick={() => { if (name && power > 0) { onAdd(name, power); setName(""); setPower(0);} }}>Add</button>
    </div>
  );
}
