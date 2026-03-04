"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      router.push("/auth/login");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to register");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Name</label>
          <input className="w-full mb-3 p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block mb-2">Email</label>
          <input className="w-full mb-3 p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="block mb-2">Password</label>
          <input type="password" className="w-full mb-3 p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-green-600 text-white p-2 rounded">Create account</button>
        </form>
        <div className="mt-4 text-sm">
          <a href="/auth/login" className="text-blue-600">Back to login</a>
        </div>
      </div>
    </div>
  );
}
