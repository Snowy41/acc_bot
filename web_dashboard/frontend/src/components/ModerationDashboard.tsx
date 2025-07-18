import { useState, useEffect } from "react";

export default function ModerationDashboard() {
  const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<any[]>([]);
    const [myUsertag, setMyUsertag] = useState(""); // <-- define this!
    const myTickets = tickets.filter(t => t.assigned_to === myUsertag);

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

  useEffect(() => {
  fetch("/api/auth/status", { credentials: "include" })
    .then(res => res.json())
    .then(data => setMyUsertag(data.usertag));
  fetch("/api/tickets", { credentials: "include" })
    .then(res => res.json())
    .then(data => setTickets(data.tickets || []));
    }, []);

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
                    <span
                      className={`
                        px-2 py-0.5 rounded text-xs font-bold border
                        ${t.status === "open"
                          ? "bg-cyan-500/30 text-cyan-100 border-cyan-400/50"
                          : "bg-[#212e3c]/80 text-gray-300 border-cyan-900/40"
                        }
                      `}
                    >
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
        <div className="mt-12">
          <h2 className="text-xl text-indigo-400 font-bold mb-5">My Assigned Tickets</h2>
          {myTickets.length === 0 ? (
            <div className="text-gray-400">No assigned tickets.</div>
          ) : (
            <ul className="space-y-4">
              {myTickets.map((t: any) => (
                <li key={t.id} className="border border-cyan-900/20 rounded p-4 bg-[#1d2532]">
                  <div className="flex flex-wrap gap-3 items-center mb-1">
                    <span className="font-bold text-cyan-300">{t.subject}</span>
                    <span className="text-xs text-cyan-400 font-mono">{t.usertag}</span>
                    <span
                      className={`
                        px-2 py-0.5 rounded text-xs font-bold border
                        ${t.status === "open"
                          ? "bg-cyan-500/30 text-cyan-100 border-cyan-400/50"
                          : "bg-[#212e3c]/80 text-gray-300 border-cyan-900/40"
                        }
                      `}
                    >
                      {t.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-700/20 text-indigo-200 border border-indigo-400/30">
                      Assigned: {t.assigned_to}
                    </span>
                  </div>
                  <div className="text-white mt-1 mb-2">{t.body}</div>

                  {/* Messages/Replies */}
                  {t.messages && t.messages.length > 0 && (
                    <div className="bg-[#18212e]/80 border border-cyan-900/20 rounded p-3 mb-2">
                      <div className="text-cyan-300 font-semibold mb-1">Replies</div>
                      <ul className="space-y-2">
                        {t.messages.map((msg: any, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="font-bold text-cyan-400">{msg.from}:</span>
                            <span className="text-white">{msg.text}</span>
                            <span className="ml-2 text-xs text-gray-400">{new Date(msg.timestamp * 1000).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions: Close/Reopen */}
                  <div className="flex gap-2 mt-3">
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

                  {/* Reply input (optional, only if you want mod to send a message) */}
                  <TicketReplyBox ticket={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketReplyBox({ ticket }: { ticket: any }) {
  const [reply, setReply] = useState("");
  const handleSend = async () => {
    if (!reply) return;
    await fetch(`/api/tickets/${ticket.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: reply }),
    });
    setReply("");
    // Optionally: reload tickets/messages here!
  };
  return (
    <div className="flex gap-2 mt-3">
      <input
        className="flex-1 px-3 py-2 rounded bg-[#232e43] border border-cyan-800 text-white"
        value={reply}
        onChange={e => setReply(e.target.value)}
        placeholder="Type a reply..."
      />
      <button
        className="bg-aqua text-midnight font-bold rounded px-4 py-2 hover:bg-cyan-400"
        onClick={handleSend}
        disabled={!reply}
      >
        Send
      </button>
    </div>
  );
}
