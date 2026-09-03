"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Mail, 
  History, 
  Search, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Eye, 
  Sparkles,
  Paperclip,
  Check
} from "lucide-react";
import { useSearchParams } from "next/navigation";

function CommunicationsContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [audience, setAudience] = useState(initialEmail ? "SPECIFIC" : "ALL_USERS");
  const [selectedEmails, setSelectedEmails] = useState(initialEmail ? [initialEmail] : []);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("composer"); // "composer" | "preview" for mobile

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

  // Search users dynamically for recipient selector
  const handleSearchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/v2/admin/users?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        setUserSearchResults(data.users || []);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setIsSearchingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery) handleSearchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, handleSearchUsers]);

  const addRecipientEmail = (email) => {
    if (email && !selectedEmails.includes(email)) {
      setSelectedEmails([...selectedEmails, email]);
    }
    setUserSearchQuery("");
    setUserSearchResults([]);
  };

  const removeRecipientEmail = (emailToRemove) => {
    setSelectedEmails(selectedEmails.filter(e => e !== emailToRemove));
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatusMsg({ type: "error", text: "Subject and message content are required." });
      return;
    }

    if (audience === "SPECIFIC" && selectedEmails.length === 0) {
      setStatusMsg({ type: "error", text: "Please select at least one recipient email address." });
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
          mediaUrl: mediaUrl.trim() || undefined,
          targetEmails: audience === "SPECIFIC" ? selectedEmails : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Broadcast delivery failed.");
      }

      setStatusMsg({ type: "success", text: data.message });
      setSubject("");
      setMessage("");
      setMediaUrl("");
      if (audience === "SPECIFIC") setSelectedEmails([]);
      fetchHistory();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <span>Communications & Broadcast Hub</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Compose announcements, attach media, select specific users, and inspect real-time live email previews.
          </p>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center gap-2 lg:hidden bg-[#101014] p-1 border border-[#1e1e26] rounded-xl">
          <button
            onClick={() => setActiveTab("composer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === "composer" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            Composer
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === "preview" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            Live Preview
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Composer Form (7 cols) */}
        <div className={`lg:col-span-7 space-y-6 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
          <div className="bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e1e26] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <span>Broadcast Dispatcher</span>
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Central Mail Engine
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

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Target Audience Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Select Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudience("ALL_USERS")}
                    className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition cursor-pointer ${
                      audience === "ALL_USERS"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                        : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    All Members
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience("VERIFIED_HOSTS")}
                    className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition cursor-pointer ${
                      audience === "VERIFIED_HOSTS"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                        : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Organizers Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience("SPECIFIC")}
                    className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition cursor-pointer ${
                      audience === "SPECIFIC"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                        : "bg-[#141419] border-[#25252e] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Specific Users
                  </button>
                </div>
              </div>

              {/* Dynamic User Search Picker (When Audience === "SPECIFIC") */}
              {audience === "SPECIFIC" && (
                <div className="space-y-3 p-4 bg-[#14141a] border border-[#242432] rounded-xl">
                  <label className="block text-xs font-semibold text-gray-300">
                    Search & Select Target Recipients
                  </label>
                  
                  {/* Selected Recipient Chips */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedEmails.map((email) => (
                      <span 
                        key={email}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-mono"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeRecipientEmail(email)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedEmails.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No recipients selected yet. Search below to add users.</p>
                    )}
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Type name or email to search registered users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-[#181822] border border-[#2a2a3a] focus:border-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                    />
                    {isSearchingUsers && (
                      <div className="absolute right-3 top-3 text-[10px] text-gray-400 animate-pulse font-mono">
                        Searching...
                      </div>
                    )}

                    {/* Auto-complete Dropdown Results */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#181824] border border-[#2c2c3e] rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                        {userSearchResults.map((u) => {
                          const isAdded = selectedEmails.includes(u.email);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => addRecipientEmail(u.email)}
                              disabled={isAdded}
                              className={`w-full text-left px-4 py-2.5 text-xs border-b border-[#222230] last:border-none flex items-center justify-between transition-colors ${
                                isAdded ? "bg-[#1c1c28] text-gray-500" : "hover:bg-[#222232] text-gray-200"
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-white">{u.fullName || u.name || "User"}</p>
                                <p className="text-[11px] font-mono text-gray-400">{u.email}</p>
                              </div>
                              {isAdded ? (
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Select
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g. Important Announcement: Upcoming Hackathon Registration"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-[#25252e] focus:border-blue-500 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                  required
                />
              </div>

              {/* Media Request / Banner Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Media Request / Banner Image (Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMediaInput(!showMediaInput)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showMediaInput ? "Hide Media Field" : "+ Add Media URL"}
                  </button>
                </div>

                {(showMediaInput || mediaUrl) && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (e.g. https://images.unsplash.com/... or https://res.cloudinary.com/...)"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-[#25252e] focus:border-purple-500 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono"
                    />
                    {mediaUrl && (
                      <div className="p-2 bg-[#181822] border border-[#262634] rounded-xl flex items-center gap-3">
                        <img 
                          src={mediaUrl} 
                          alt="Media Preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-[#333344]" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="text-[11px] text-gray-400 truncate">
                          <p className="font-semibold text-white">Media Attached</p>
                          <p className="truncate font-mono">{mediaUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Message Body Content
                </label>
                <textarea
                  rows={7}
                  placeholder="Write announcement details here. Line breaks are converted into formatted paragraphs in the email..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#141419] border border-[#25252e] focus:border-blue-500 text-xs text-white placeholder-gray-500 outline-none font-mono transition-colors"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? "Dispatching..." : "Send Email Broadcast"}
                </button>
              </div>
            </form>
          </div>

          {/* Broadcast History Card */}
          <div className="bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Broadcast History Log</span>
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

        {/* Right Column: Live Email Preview (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${activeTab === "composer" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Live Email Preview</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                REAL-TIME HTML RENDER
              </span>
            </div>

            {/* Email Client Wrapper Mockup */}
            <div className="bg-[#0e0e12] border border-[#242432] rounded-2xl overflow-hidden shadow-2xl">
              {/* Mail Client Header Bar */}
              <div className="bg-[#16161f] border-b border-[#242432] px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">From:</span>
                  <span className="text-white font-medium">UNCOOKED &lt;support@uncooked.in&gt;</span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-[#222230] pt-2">
                  <span className="text-gray-400 font-mono text-[11px]">To:</span>
                  <span className="text-blue-400 font-medium">
                    {audience === "ALL_USERS"
                      ? "All Members (Broadcast)"
                      : audience === "VERIFIED_HOSTS"
                      ? "Verified Organizers Only"
                      : selectedEmails.length > 0
                      ? selectedEmails.join(", ")
                      : "Specific Recipients"}
                  </span>
                </div>

                <div className="border-t border-[#222230] pt-2">
                  <p className="text-xs font-bold text-white truncate">
                    {subject.trim() ? `[Announcement] ${subject}` : "Subject Preview Line..."}
                  </p>
                </div>
              </div>

              {/* Email Content Body Frame */}
              <div className="p-6 bg-[#0a0a0c] text-gray-200 text-xs space-y-5">
                {/* Brand Badge Header */}
                <div className="text-center border-b border-[#22222e] pb-4">
                  <span className="text-lg font-extrabold text-white tracking-tight">
                    UN<span className="text-[var(--accent-orange)]">COOKED</span>
                  </span>
                </div>

                {/* Announcement Title */}
                <div>
                  <h4 className="text-base font-bold text-white">
                    📢 Announcement from Uncooked Admin
                  </h4>
                </div>

                {/* Media Image Banner Render */}
                {mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#282838] bg-[#14141d]">
                    <img 
                      src={mediaUrl} 
                      alt="Banner Preview" 
                      className="w-full max-h-56 object-cover" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Message Body Render */}
                <div className="text-gray-300 leading-relaxed font-sans space-y-3 bg-[#121218] p-4 rounded-xl border border-[#222230]">
                  {message.trim() ? (
                    message.split("\n").map((line, idx) => (
                      <p key={idx} className="min-h-[1em]">{line || <br />}</p>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      Start typing your message content in the composer to view the formatted email layout here...
                    </p>
                  )}
                </div>

                {/* Action CTA Button Mockup */}
                <div className="text-center pt-2">
                  <span className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-orange)] text-black font-bold text-xs shadow-md">
                    Open Portal
                  </span>
                </div>

                {/* Email Footer Banner */}
                <div className="border-t border-[#22222e] pt-4 text-center text-[10px] text-gray-500 space-y-1">
                  <p>© {new Date().getFullYear()} Uncooked Portal. All rights reserved.</p>
                  <p>Privacy Policy • Support Desk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCommunicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-mono">Loading communications desk...</div>}>
      <CommunicationsContent />
    </Suspense>
  );
}
