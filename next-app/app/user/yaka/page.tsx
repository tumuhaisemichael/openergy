"use client";

import React, { useEffect, useState } from "react";

type Appliance = { name: string; power: number; hoursPerDay?: number };

export default function YakaPage() {
  const [availableAppliances, setAvailableAppliances] = useState<Appliance[]>([]);
  const [selected, setSelected] = useState<Appliance[]>([]);
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<string>("days");
  const [result, setResult] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // Load available appliances
    fetch("/api/user/appliances")
      .then((r) => r.json())
      .then((d) => setAvailableAppliances(d.appliances || []));

    // Load user's saved appliances from database
    fetch("/api/user/appliances/save")
      .then((r) => r.json())
      .then((d) => {
        if (d.appliances && d.appliances.length > 0) {
          setSelected(d.appliances);
        }
      });
  }, []);

  function addAppliance(index: number) {
    const app = availableAppliances[index];
    if (app) {
      setSelected((s) => [...s, { ...app, hoursPerDay: 0 }]);
    }
  }

  function addCustom(name: string, power: number) {
    setSelected((s) => [...s, { name, power, hoursPerDay: 0 }]);
  }

  function updateHours(idx: number, hours: number) {
    setSelected((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], hoursPerDay: hours };
      return copy;
    });
  }

  function removeAppliance(idx: number) {
    setSelected((s) => s.filter((_, i) => i !== idx));
  }

  function calculateUsage() {
    let totalW = 0;
    selected.forEach((app) => {
      totalW += app.power * (app.hoursPerDay || 0);
    });

    const days = durationUnit === "days" ? durationValue : durationUnit === "weeks" ? durationValue * 7 : durationValue * 30;
    const totalWh = totalW * days;
    const yakaUnits = (totalWh / 1000).toFixed(2);
    setResult(`${yakaUnits} Yaka units for the selected period.`);
  }

  async function saveToDatabase() {
    setSaveMessage("Saving...");
    try {
      const res = await fetch("/api/user/appliances/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliances: selected }),
      });
      if (res.ok) {
        setSaveMessage("Saved to profile successfully!");
      } else {
        setSaveMessage("Failed to save.");
      }
    } catch (err) {
      setSaveMessage("Error saving.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Yaka Usage Calculator</h1>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-2">Add Appliance</h3>
            <select onChange={(e) => { if (e.target.value) addAppliance(Number(e.target.value)); e.target.value = ""; }} className="w-full p-2 border rounded">
              <option value="">-- select --</option>
              {availableAppliances.map((a, i) => (
                <option key={i} value={i}>{a.name} ({a.power}W)</option>
              ))}
            </select>

            <h3 className="mt-6 font-semibold text-lg mb-2">Custom Appliance</h3>
            <CustomAdd onAdd={(n, p) => addCustom(n, p)} />

            <div className="mt-8 pt-6 border-t">
               <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded shadow transition-colors" onClick={saveToDatabase}>
                 Save List to Profile
               </button>
               {saveMessage && <div className="mt-2 text-center text-sm font-medium text-blue-600">{saveMessage}</div>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Current Configuration</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selected.length === 0 ? <p className="text-gray-400 italic">No appliances added yet.</p> : selected.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded bg-gray-50 group">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.power} Watts</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={s.hoursPerDay || ""}
                      onChange={(e) => updateHours(i, Number(e.target.value))}
                      placeholder="Hours"
                      className="w-20 p-1 border rounded text-sm text-center"
                    />
                    <button onClick={() => removeAppliance(i)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">&times;</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Calculate usage over:</label>
              <div className="flex gap-2">
                <input type="number" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} className="p-2 border rounded w-24 text-center" />
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="flex-1 p-2 border rounded">
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>

              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded shadow transition-colors" onClick={calculateUsage}>
                Estimate Units
              </button>
              {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-center animate-in fade-in duration-300">
                  <div className="text-green-800 font-bold text-xl">{result}</div>
                  <div className="text-xs text-green-600 mt-1 italic">Note: 1 Unit = 1 kWh</div>
                </div>
              )}
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
    <div className="space-y-2">
      <input placeholder="Appliance Name" className="w-full p-2 border rounded text-sm" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Power Rating (Watts)" className="w-full p-2 border rounded text-sm" value={power === 0 ? "" : power} onChange={(e) => setPower(Number(e.target.value))} />
      <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold p-2 rounded transition-colors" onClick={() => { if (name && power > 0) { onAdd(name, power); setName(""); setPower(0);} }}>Add Appliance</button>
    </div>
  );
}
