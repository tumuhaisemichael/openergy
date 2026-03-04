"use client";

import { useState, useEffect } from "react";

function fileToBase64(file: File | null): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function UserUpdate() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [job, setJob] = useState("");
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);

  async function loadProfile() {
    const res = await fetch("/api/auth/profile");
    if (res.ok) {
      const data = await res.json();
      setName(data.user.name || "");
      setPhone(data.user.employee?.phone || "");
      setJob(data.user.employee?.job || "");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const avatarBase64 = await fileToBase64(avatarFile);
      const documentsBase64 = await fileToBase64(documentsFile);

      const payload: any = { name, phone, job };
      if (avatarBase64) payload.avatarBase64 = avatarBase64;
      if (documentsBase64) payload.documentsBase64 = documentsBase64;

      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Submitted for approval.");
      } else {
        const d = await res.json();
        setMessage(d.error || "Failed");
      }
    } catch (err) {
      setMessage("Upload failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Update Profile</h1>
        {message && <div className="mb-2 text-green-700">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-1">Name</label>
          <input className="w-full mb-3 p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block mb-1">Phone</label>
          <input className="w-full mb-3 p-2 border rounded" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="block mb-1">Job</label>
          <input className="w-full mb-3 p-2 border rounded" value={job} onChange={(e) => setJob(e.target.value)} />

          <label className="block mb-1">Avatar (image)</label>
          <input type="file" accept="image/*" className="w-full mb-3" onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)} />

          <label className="block mb-1">Documents (PDF/image)</label>
          <input type="file" accept="application/pdf,image/*" className="w-full mb-3" onChange={(e) => setDocumentsFile(e.target.files ? e.target.files[0] : null)} />

          <button className="w-full bg-green-600 text-white p-2 rounded">Submit</button>
        </form>
      </div>
    </div>
  );
}
