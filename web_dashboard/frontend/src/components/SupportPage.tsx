// /components/SupportPage.tsx
import { useState, useEffect } from "react";

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => {
    fetch("/api/tickets", { credentials: "include" })
      .then(res => res.json())
      .then(data => setTickets(data.tickets || []));
  }, []);
  const handleSubmit = async () => {
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject, body }),
    });
    setSubject(""); setBody("");
    fetch("/api/tickets", { credentials: "include" })
      .then(res => res.json())
      .then(data => setTickets(data.tickets || []));
  };
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h2 className="text-3xl text-aqua font-bold mb-8">Support</h2>
      <div className="bg-[#18212e]/80 border border-cyan-800 rounded-xl p-6 mb-8">
        <h3 className="text-xl text-cyan-300 font-bold mb-3">Create Ticket</h3>
        <input
          className="w-full mb-2 px-4 py-2 rounded bg-[#232e43] border border-cyan-800 text-white"
          placeholder="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <textarea
          className="w-full mb-3 px-4 py-2 rounded bg-[#232e43] border border-cyan-800 text-white"
          placeholder="Describe your issue..."
          rows={5}
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button
          className="bg-aqua text-midnight font-bold px-5 py-2 rounded hover:bg-cyan-400"
          onClick={handleSubmit}
          disabled={!subject || !body}
        >
          Submit Ticket
        </button>
      </div>
      <div className="bg-[#18212e]/70 border border-cyan-800 rounded-xl p-6">
        <h3 className="text-lg text-cyan-300 font-bold mb-2">Your Tickets</h3>
        {tickets.length === 0 ? (
          <div className="text-gray-400">No tickets yet.</div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t: any) => (
              <li key={t.id} className="border border-cyan-900/30 rounded p-3 bg-[#232e43]">
                <div className="font-bold text-cyan-200">{t.subject}</div>
                <div className="text-cyan-400 text-xs">{new Date(t.created_at * 1000).toLocaleString()} - {t.status}</div>
                <div className="text-white mt-1">{t.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
