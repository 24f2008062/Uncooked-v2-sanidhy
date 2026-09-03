"use client";

import { useState, useEffect } from "react";
import { HelpCircle, LifeBuoy, Send, CheckCircle2, Clock, AlertCircle, User, MessageSquare } from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/v2/admin/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.tickets && data.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
          setNewStatus(data.tickets[0].status);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch tickets", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/v2/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyMessage,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reply failed");
      }

      setStatusMsg({ type: "success", text: "Response sent and notification email dispatched to user." });
      setReplyMessage("");
      setSelectedTicket(data.ticket);
      fetchTickets();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-pink-400" />
          <span>Support Ticket Help Desk</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage attendee inquiries, dispatch email responses directly to user inboxes, and track resolution statuses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="bg-[#101014] border border-[#1e1e26] p-4 rounded-2xl space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Support Tickets ({tickets.length})</h2>

          {tickets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <LifeBuoy className="w-8 h-8 text-pink-400/40 mx-auto" />
              <p className="text-xs text-gray-500">No support tickets currently open.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNewStatus(ticket.status);
                    setStatusMsg(null);
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition space-y-1.5 ${
                    selectedTicket?.id === ticket.id
                      ? "bg-pink-500/10 border-pink-500/30 text-white"
                      : "bg-[#141419] border-[#25252e] text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-pink-400">#{ticket.id.slice(-6)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      ticket.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{ticket.subject}</h4>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-500" />
                    <span>{ticket.user?.name || ticket.user?.email || "Anonymous"}</span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Details & Response Desk */}
        <div className="lg:col-span-2 space-y-6 bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl">
          {!selectedTicket ? (
            <div className="p-12 text-center text-gray-500 text-xs">Select a ticket from the left panel to inspect thread and send email reply.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1e1e26] pb-4">
                <div>
                  <span className="text-xs font-mono text-pink-400">Ticket #{selectedTicket.id}</span>
                  <h2 className="text-base font-bold text-white mt-0.5">{selectedTicket.subject}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    From {selectedTicket.user?.name || "User"} ({selectedTicket.user?.email}) &bull; Category: {selectedTicket.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#141419] border border-[#25252e] text-xs text-white focus:outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        msg.senderType === "STAFF"
                          ? "bg-pink-950/20 border border-pink-900/40 text-pink-100 ml-6"
                          : "bg-[#141419] border border-[#25252e] text-gray-200 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-semibold">{msg.senderType === "STAFF" ? "Support Agent" : selectedTicket.user?.name || "User"}</span>
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No previous message history.</p>
                )}
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  statusMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-gray-300">Reply & Dispatch Email Notification</label>
                <textarea
                  rows={4}
                  placeholder="Type your response to the user here. An email notification will automatically be sent to their inbox."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-[#25252e] text-xs text-white focus:outline-none focus:border-pink-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {loading ? "Sending..." : "Dispatch Response & Email"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
