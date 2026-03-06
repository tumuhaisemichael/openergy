"use client";

import React, { useEffect, useState } from "react";

export default function ConnectPage() {
  const [connected, setConnected] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/user/connect").then((r) => r.json()).then((d) => setConnected(d.connected || []));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Connected Devices</h1>
        <ul className="mt-4">
          {connected.map((c) => (
            <li key={c.id} className="p-2 border-b">{c.name} — {c.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
