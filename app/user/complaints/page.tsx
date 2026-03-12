"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, AlertCircle } from "lucide-react";
import HelpOverlay from "@/app/components/HelpOverlay";

type Complaint = {
  id: number;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
};

const helpContent = {
  title: "Support & Complaints",
  description:
    "Send issues or feedback to the admin team and track the status of your complaint from submission to resolution.",
  howTo: [
    "Write a clear subject and describe the issue in detail.",
    "Select a priority based on urgency.",
    "Submit the complaint and monitor status updates below.",
  ],
  results: [
    "A logged complaint visible to admins.",
    "Status updates as your issue is reviewed.",
    "A record of your previous complaints.",
  ],
};

export default function ComplaintsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  async function loadComplaints() {
    try {
      const res = await fetch("/api/user/complaints");
      const data = await res.json();
      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
    } catch {
      setComplaints([]);
    }
  }

  useEffect(() => {
    void loadComplaints();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to submit complaint.");
      } else {
        setSuccess("Complaint submitted successfully.");
        setSubject("");
        setMessage("");
        setPriority("normal");
        await loadComplaints();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-6xl space-y-6">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-700 font-black">Support Center</p>
              <h1 className="page-title mt-2">Send a Complaint</h1>
              <p className="page-subtitle mt-2">Report issues, request help, or share feedback with the admin team.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HelpOverlay {...helpContent} />
              <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-lg font-black text-slate-900">Complaint Form</h2>
            <p className="text-sm text-slate-600 mt-2">Provide details so the admin can resolve your issue quickly.</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            {success && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Subject
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Incorrect tariff calculation"
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe the problem and steps that lead to it."
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Complaint"} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-black text-slate-900">My Complaints</h2>
            {complaints.length === 0 ? (
              <p className="text-sm text-slate-500">No complaints submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {complaints.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-slate-900/10 px-2 py-1 text-slate-700">{item.status}</span>
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">{item.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
