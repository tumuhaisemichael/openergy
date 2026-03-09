"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UserUpdate() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    const res = await fetch("/api/auth/profile");
    if (res.ok) {
      const data = await res.json();
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (res.ok) {
        setMessage("Profile updated successfully.");
      } else {
        const d = await res.json();
        setMessage(d.error || "Failed to update profile.");
      }
    } catch {
      setMessage("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-3xl">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                {(name || "U")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="page-title">Update Profile</h1>
                <p className="page-subtitle">Keep your contact details current for account support.</p>
              </div>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Back to Dashboard
            </Link>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Full Name
              <input
                className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Phone Number
              <input
                className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <button
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white font-bold p-3 rounded-xl transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
