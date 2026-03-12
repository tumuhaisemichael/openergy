"use client";

import Link from "next/link";
import HelpOverlay from "@/app/components/HelpOverlay";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type ConnectedDevice = {
  id: string;
  name: string;
  status: string;
  type: "wireless" | "remote";
  protocol: string;
  source: "api" | "manual";
};

const helpContent = {
  title: "Connected Devices",
  description:
    "Track devices connected to your home setup so you can prepare for smart-meter integration and future monitoring.",
  howTo: [
    "Add a device name, type, and protocol.",
    "Save the device to include it in your household setup list.",
    "Remove devices you no longer use or manage.",
  ],
  results: [
    "A clean list of connected devices and their status.",
    "Faster onboarding once live integrations are available.",
    "A record of your monitoring-ready setup.",
  ],
};

export default function ConnectPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "anonymous";
  const storageKey = `openergy:devices:${userId}`;

  const [connected, setConnected] = useState<ConnectedDevice[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"wireless" | "remote">("wireless");
  const [protocol, setProtocol] = useState("Wi-Fi");
  const [status, setStatus] = useState("online");
  const [btSupported, setBtSupported] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);
  const [btScanning, setBtScanning] = useState(false);

  useEffect(() => {
    let active = true;

    if (typeof window !== "undefined") {
      setBtSupported("bluetooth" in navigator);
    }

    async function loadDevices() {
      let apiDevices: ConnectedDevice[] = [];

      try {
        const res = await fetch("/api/user/connect");
        const data = await res.json();
        apiDevices = Array.isArray(data.connected)
          ? data.connected.map((device: { id?: number; name: string; status: string }) => ({
              id: `api-${String(device.id || Math.random())}`,
              name: device.name,
              status: device.status,
              type: "wireless",
              protocol: "Wi-Fi",
              source: "api",
            }))
          : [];
      } catch {
        apiDevices = [];
      }

      let localDevices: ConnectedDevice[] = [];
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as ConnectedDevice[];
            localDevices = Array.isArray(parsed) ? parsed : [];
          } catch {
            localDevices = [];
          }
        }
      }

      if (active) setConnected([...localDevices, ...apiDevices]);
    }

    loadDevices();

    return () => {
      active = false;
    };
  }, [storageKey]);

  const manualDevices = useMemo(() => connected.filter((device) => device.source === "manual"), [connected]);

  function saveManualDevices(devices: ConnectedDevice[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(devices));
  }

  async function searchBluetoothDevices() {
    if (typeof window === "undefined") return;
    if (!("bluetooth" in navigator)) {
      setBtError("Bluetooth is not supported in this browser.");
      return;
    }

    setBtError(null);
    setBtScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      });

      let nextStatus = "online";
      if (device.gatt) {
        try {
          await device.gatt.connect();
        } catch {
          nextStatus = "pending";
        }
      }

      const deviceName = device.name || "Bluetooth device";
      const connectedDevice: ConnectedDevice = {
        id: `bt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: deviceName,
        status: nextStatus,
        type: "wireless",
        protocol: "Bluetooth",
        source: "manual",
      };

      const nextManual = [connectedDevice, ...manualDevices];
      saveManualDevices(nextManual);
      setConnected((prev) => [connectedDevice, ...prev]);
      setProtocol("Bluetooth");
      setName("");
      setStatus(nextStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bluetooth connection was cancelled.";
      setBtError(message);
    } finally {
      setBtScanning(false);
    }
  }

  function addManualDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const device: ConnectedDevice = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      status,
      type,
      protocol,
      source: "manual",
    };

    const nextManual = [device, ...manualDevices];
    saveManualDevices(nextManual);
    setConnected((prev) => [device, ...prev]);
    setName("");
    setProtocol(type === "wireless" ? "Wi-Fi" : "Internet");
  }

  function removeDevice(id: string) {
    const nextConnected = connected.filter((device) => device.id !== id);
    setConnected(nextConnected);

    const nextManual = manualDevices.filter((device) => device.id !== id);
    saveManualDevices(nextManual);
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-4xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-black">Device Integration</p>
              <h1 className="page-title mt-2">Connected Devices</h1>
              <p className="page-subtitle mt-2">
                Keep track of connected devices and prepare for smart monitoring features.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HelpOverlay {...helpContent} />
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>

          <form onSubmit={addManualDevice} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Device name"
              className="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value as "wireless" | "remote")}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="wireless">Wireless</option>
              <option value="remote">Remote</option>
            </select>

            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option>Wi-Fi</option>
              <option>Bluetooth</option>
              <option>Zigbee</option>
              <option>Internet</option>
              <option>Other</option>
            </select>

            <button className="rounded-xl bg-sky-600 text-white font-bold px-4 py-3">Add Device</button>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="pending">Pending</option>
            </select>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={searchBluetoothDevices}
              disabled={!btSupported || btScanning || type !== "wireless"}
              className="rounded-xl bg-emerald-600 text-white font-bold px-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {btScanning ? "Searching..." : "Search for Bluetooth devices"}
            </button>
            <p className="text-xs text-slate-500">
              {type !== "wireless"
                ? "Switch to Wireless to search for nearby Bluetooth devices."
                : btSupported
                  ? "A device picker will appear with nearby Bluetooth devices."
                  : "Bluetooth is not supported in this browser."}
            </p>
          </div>

          {btError && <p className="mt-2 text-sm text-red-600 font-semibold">{btError}</p>}

          <ul className="mt-6 space-y-3">
            {connected.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No devices connected yet.
              </li>
            ) : (
              connected.map((device) => (
                <li key={device.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{device.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      {device.type} · {device.protocol} {device.source === "manual" ? "· Added by you" : "· Auto detected"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                      {device.status}
                    </span>
                    {device.source === "manual" && (
                      <button
                        type="button"
                        onClick={() => removeDevice(device.id)}
                        className="text-xs font-bold px-2 py-1 rounded-md bg-red-50 text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
