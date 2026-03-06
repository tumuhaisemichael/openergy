"use client";

import React, { useEffect, useState } from "react";

export default function AppliancesPage() {
  const [appliances, setAppliances] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/user/appliances").then((r) => r.json()).then((d) => setAppliances(d.appliances || []));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Appliances</h1>
        <ul className="mt-4">
          {appliances.map((a, i) => (
            <li key={i} className="p-2 border-b">{a.name} — {a.power}W</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
