"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: in production trigger email
    setMessage("If that email exists, password reset instructions were sent (placeholder).");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        {message && <div className="text-green-700 mb-2">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email</label>
          <input className="w-full mb-3 p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="w-full bg-green-600 text-white p-2 rounded">Send reset link</button>
        </form>
      </div>
    </div>
  );
}
