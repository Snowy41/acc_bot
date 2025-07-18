import { useState, useEffect } from "react";

export default function ModerationDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setTickets(data.tickets || []); setLoading(false); });
  }, []);

  const updateTicket = async (id: string, fields: any) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(fields),
    });
    setTickets(tickets => tickets.map(t => t.id === id ? { ...t, ...fields } : t));
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-3xl text-indigo-400 font-bold mb-8">Moderator Dashboard</h2>
      <div className="bg-[#19212f]/85 border border-indigo-800 rounded-xl p-6">
        <h3 className="text-xl text-indigo-200 font-bold mb-3">Tickets</h3>
        {tickets.length === 0 ? (
          <div className="text-gray-400">No tickets found.</div>
        ) : (
          <ul className="space-y-4">
            {tickets.map((t: any) => (
              <li key={t.id} className="border border-cyan-900/20 rounded p-4 bg-[#212c3c]">
                <div className="flex flex-wrap gap-3 items-center mb-1">
                  <span className="font-bold text-cyan-300">{t.subject}</span>
                  <span className="text-xs text-cyan-400 font-mono">{t.usertag}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.status === "open" ? "bg-yellow-300/30 text-yellow-900" : "bg-green-300/30 text-green-800"}`}>
                    {t.status}
                  </span>
                  {t.assigned_to && (
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-700/20 text-indigo-200">Assigned: {t.assigned_to}</span>
                  )}
                </div>
                <div className="text-white mt-1">{t.body}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-indigo-500 text-white rounded px-3 py-1 font-bold hover:bg-indigo-400"
                    onClick={() => updateTicket(t.id, { assigned_to: "CURRENT_MOD_USERTAG" })}
                  >
                    Assign to Me
                  </button>
                  <button
                    className={`rounded px-3 py-1 font-bold
                      ${t.status === "open"
                        ? "bg-aqua text-midnight hover:bg-cyan-400"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}
                    onClick={() => updateTicket(t.id, { status: t.status === "open" ? "closed" : "open" })}
                  >
                    {t.status === "open" ? "Close" : "Reopen"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
