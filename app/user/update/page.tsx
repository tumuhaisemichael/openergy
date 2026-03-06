"use client";

import { useState, useEffect } from "react";

export default function UserUpdate() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
        setMessage(d.error || "Failed");
      }
    } catch (err) {
      setMessage("Update failed");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Update Profile</h1>
        {message && <div className="mb-4 text-green-700 font-semibold">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-1 font-medium text-gray-700">Full Name</label>
          <input className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-green-500" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
          <input className="w-full mb-6 p-2 border rounded focus:ring-2 focus:ring-green-500" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded transition-colors shadow-sm">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
