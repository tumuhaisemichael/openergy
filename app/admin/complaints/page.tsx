"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Flag, Inbox, ShieldAlert } from "lucide-react";

type Complaint = {
  id: number;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  async function loadComplaints() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/complaints");
      if (!res.ok) {
        setError("Failed to load complaints.");
        return;
      }
      const data = await res.json();
      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
    } catch {
      setError("Network error while loading complaints.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadComplaints();
  }, []);

  async function updateComplaint(id: number, updates: { status?: string; priority?: string }) {
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        await loadComplaints();
      }
    } catch {
      setError("Failed to update complaint.");
    }
  }

  const summary = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === "open").length;
    const inReview = complaints.filter((c) => c.status === "review").length;
    const closed = complaints.filter((c) => c.status === "closed").length;
    return { total, open, inReview, closed };
  }, [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterPriority !== "all" && c.priority !== filterPriority) return false;
      return true;
    });
  }, [complaints, filterStatus, filterPriority]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8">Loading complaints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-container card p-8 text-red-700 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container max-w-7xl space-y-5">
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-rose-700 font-black">Admin Support</p>
              <h1 className="page-title mt-1">Complaints & Reports</h1>
              <p className="page-subtitle mt-2">Review, prioritize, and resolve user complaints.</p>
            </div>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
            <SummaryCard label="Total" value={`${summary.total}`} icon={<Inbox className="w-4 h-4" />} />
            <SummaryCard label="Open" value={`${summary.open}`} icon={<ShieldAlert className="w-4 h-4" />} />
            <SummaryCard label="In Review" value={`${summary.inReview}`} icon={<Flag className="w-4 h-4" />} />
            <SummaryCard label="Closed" value={`${summary.closed}`} icon={<CheckCircle2 className="w-4 h-4" />} />
          </div>
        </div>

        <div className="card p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Filter by status
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="review">In Review</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Filter by priority
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-8 text-slate-500 italic text-center">No complaints match the current filters.</div>
          ) : (
            filtered.map((complaint) => (
              <div key={complaint.id} className="card p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{complaint.subject}</h2>
                    <p className="text-sm text-slate-600 mt-1">{complaint.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {complaint.user.name} · {complaint.user.email} · {new Date(complaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <select
                      value={complaint.status}
                      onChange={(e) => updateComplaint(complaint.id, { status: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold"
                    >
                      <option value="open">Open</option>
                      <option value="review">In Review</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={complaint.priority}
                      onChange={(e) => updateComplaint(complaint.id, { priority: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{complaint.status}</span>
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">{complaint.priority}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-black text-slate-500">
        {icon} {label}
      </div>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}
