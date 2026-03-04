"use client";

import { useState } from "react";

export default function ConfirmPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: in production verify and update password
    setMessage("Password confirmed (placeholder).");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Confirm Password</h1>
        {message && <div className="text-green-700 mb-2">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Password</label>
          <input type="password" className="w-full mb-3 p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-green-600 text-white p-2 rounded">Confirm</button>
        </form>
      </div>
    </div>
  );
}
