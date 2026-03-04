import React from "react";

export default function WorkPostingPage() {
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/work-posting").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setMessage(`Employee approved: ${d.employee.name}`);
      } else {
        const d = await r.json();
        setMessage(d.error || "Not authorized");
      }
    }).catch((e) => setMessage("Error fetching work posting"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">Work Posting</h1>
        <div className="mt-4">{message || "Loading..."}</div>
      </div>
    </div>
  );
}
