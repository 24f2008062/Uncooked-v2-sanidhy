"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Users, Mail, History } from "lucide-react";

export default function AdminCommunicationsPage() {
  const [audience, setAudience] = useState("ALL_USERS");
  const [targetEmails, setTargetEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/v2/admin/communications");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.warn("Failed to fetch broadcast history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatusMsg({ type: "error", text: "Subject and message are required." });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/v2/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          subject,
          message,
          targetEmails: audience === "SPECIFIC" ? targetEmails.split(",").map(e => e.trim()).filter(Boolean) : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Broadcast delivery failed.");
      }

      setStatusMsg({ type: "success", text: data.message });
      setSubject("");
      setMessage("");
      setTargetEmails("");
      fetchHistory();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <span>Communications & Broadcast Hub</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Compose targeted announcements, system alerts, and direct email notifications across student & host networks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Broadcast Form */}
        <div className="lg:col-span-2 space-y-6 bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl">
          <div className="flex items-center justify-between border-b border-[#1e1e26] pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              <span>Compose Broadcast Email</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Live Dispatch Desk
            </span>
          </div>

          {statusMsg && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
              statusMsg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience("ALL_USERS")}
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition ${
                    audience === "ALL_USERS"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                      : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Users
                </button>

                <button
                  type="button"
                  onClick={() => setAudience("VERIFIED_HOSTS")}
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition ${
                    audience === "VERIFIED_HOSTS"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                      : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Organizers Only
                </button>

                <button
                  type="button"
                  onClick={() => setAudience("SPECIFIC")}
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition ${
                    audience === "SPECIFIC"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                      : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Specific Emails
                </button>
              </div>
            </div>

            {audience === "SPECIFIC" && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Recipient Emails (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="alex@university.edu, sara@host.com"
                  value={targetEmails}
                  onChange={(e) => setTargetEmails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-[#25252e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Subject Line</label>
              <input
                type="text"
                placeholder="Important Announcement: Upcoming Hackathon Registration"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-[#25252e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Message Content (Plain Text or Line Breaks)</label>
              <textarea
                rows={6}
                placeholder="Write your email body message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-[#25252e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "Dispatching..." : "Send Email Broadcast"}
              </button>
            </div>
          </form>
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Broadcast Log</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No recent broadcasts recorded.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  let details = {};
                  try { details = JSON.parse(item.details || "{}"); } catch {}
                  return (
                    <div key={item.id} className="p-3 bg-[#141419] border border-[#25252e] rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-blue-400">
                        <span>{item.action}</span>
                        <span className="text-gray-500 font-normal">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-white font-medium truncate">{details.subject || "Broadcast"}</p>
                      <p className="text-[11px] text-gray-400">{details.recipientCount || 0} recipient(s) delivered</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
