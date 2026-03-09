"use client";

import { useState } from "react";

export default function ConfirmPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Password confirmed (placeholder).");
  }

  return (
    <div className="page-shell flex items-center">
      <div className="page-container max-w-md w-full">
        <div className="card p-6">
          <h1 className="page-title">Confirm Password</h1>
          <p className="page-subtitle mt-2">This flow will verify reset tokens and set a new password.</p>
          {message && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-semibold">{message}</div>}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              New Password
              <input
                type="password"
                className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold">Confirm Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
