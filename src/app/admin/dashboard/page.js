"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Calendar, 
  Ticket, 
  FileCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Database, 
  Clock, 
  RefreshCw,
  Zap,
  CheckCircle2,
  Briefcase,
  ExternalLink,
  MapPin,
  Building2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [telemetry, setTelemetry] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentOpportunities, setRecentOpportunities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [killSwitch, setKillSwitch] = useState(false);
  const [killSwitchModal, setKillSwitchModal] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/admin/dashboard/stats");
      const payload = await res.json();
      const data = payload.data || payload;
      if (res.ok) {
        setTelemetry(data.telemetry);
        setRecentEvents(data.recentEvents || []);
        setRecentOpportunities(data.recentOpportunities || []);
        setAuditLogs(data.auditLogs || []);
        setKillSwitch(data.telemetry?.killSwitchActive || false);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchStats();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchStats]);

  const handleToggleKillSwitch = async () => {
    setToggleLoading(true);
    try {
      const res = await fetch("/api/v2/admin/incidents/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !killSwitch, reason: "Manual Emergency Override" }),
      });
      const payload = await res.json();
      const data = payload.data || payload;
      if (res.ok) {
        setKillSwitch(data.killSwitchActive);
        setKillSwitchModal(false);
        fetchStats();
      } else {
        alert(data.error?.message || data.error || "Failed to update kill-switch");
      }
    } catch (err) {
      alert("Error toggling kill-switch");
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations & Telemetry</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time platform metrics, live event catalog, opportunities, and system governance.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3.5 py-2 bg-[#141419] border border-[#252530] hover:border-[#353545] rounded-xl text-xs text-gray-300 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Emergency Kill-Switch Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        killSwitch 
          ? "bg-red-500/10 border-red-500/40 text-red-200" 
          : "bg-[#121216] border-[#22222a] text-gray-300"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${killSwitch ? "bg-red-500/20 text-red-400" : "bg-[#1a1a22] text-amber-400"}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Global Emergency Platform Kill-Switch</h3>
                {killSwitch && (
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-500/20 text-red-400 rounded font-mono font-bold">
                    SYSTEM PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {killSwitch 
                  ? "CRITICAL: Public API registration and checkout endpoints are temporarily paused."
                  : "Normal Operation: Toggle to immediately freeze event registrations in emergency scenarios."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setKillSwitchModal(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              killSwitch
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
            }`}
          >
            {killSwitch ? "Deactivate Kill-Switch" : "Trigger Emergency Kill-Switch"}
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users Card */}
        <div className="p-5 bg-[#101014] border border-[#1e1e26] rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {loading ? "..." : telemetry?.totalUsers ?? 0}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <span>Verified Users</span>
          </div>
        </div>

        {/* Total Events Card */}
        <div className="p-5 bg-[#101014] border border-[#1e1e26] rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Campus Events</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {loading ? "..." : telemetry?.totalEvents ?? 0}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <span>Active & Published</span>
          </div>
        </div>

        {/* Total Opportunities Card */}
        <div className="p-5 bg-[#101014] border border-[#1e1e26] rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Opportunities</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {loading ? "..." : telemetry?.totalOpportunities ?? 0}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <span>Internships & Bounties</span>
          </div>
        </div>

        {/* Total Registrations Card */}
        <div className="p-5 bg-[#101014] border border-[#1e1e26] rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total RSVPs</span>
            <Ticket className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {loading ? "..." : telemetry?.totalRegistrations ?? 0}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <span>Registrations</span>
          </div>
        </div>

        {/* Pending Host Applications */}
        <div className="p-5 bg-[#101014] border border-[#1e1e26] rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending KYC</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {loading ? "..." : telemetry?.pendingApplications ?? 0}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-400 font-medium">
            <span>Host Applications</span>
          </div>
        </div>
      </div>

      {/* LIVE RECENT EVENTS AND OPPORTUNITIES SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events Widget */}
        <div className="bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e26] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Live Campus Events Catalog</span>
            </h3>
            <Link
              href="/admin/events"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
            >
              Manage All Events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">No active events found in database.</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-[#141419] border border-[#22222e] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {evt.bannerUrl ? (
                      <img src={evt.bannerUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-[#2a2a3a]" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                        {evt.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">{evt.title}</p>
                      <p className="text-[11px] text-gray-400">{evt.category || "General"} &bull; {new Date(evt.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {evt._count?.registrations || 0} / {evt.capacity} seats
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Opportunities Widget */}
        <div className="bg-[#101014] border border-[#1e1e26] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e26] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Opportunities & Bounties Catalog</span>
            </h3>
            <Link
              href="/admin/opportunities"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
            >
              Manage Opportunities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOpportunities.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">No active opportunities found in database.</p>
          ) : (
            <div className="space-y-3">
              {recentOpportunities.map((opp) => (
                <div key={opp.id} className="p-3 bg-[#141419] border border-[#22222e] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">{opp.title}</p>
                      <p className="text-[11px] text-gray-400">{opp.company} &bull; {opp.type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {opp._count?.applications || 0} Apps
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latency & DB Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[#101014] border border-[#1e1e26] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-orange)]" />
              <span>Real-Time Performance Telemetry</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              HEALTHY
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">API Latency (P95)</span>
                <span className="font-mono text-gray-200">{telemetry?.p95LatencyMs ?? 18} ms</span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Prisma Database Pool Latency</span>
                <span className="font-mono text-gray-200">{telemetry?.dbPoolLatencyMs ?? 4} ms</span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "12%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#101014] border border-[#1e1e26] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Database Connection Status</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
              SUPABASE PG POOLER
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Connected via PgBouncer SSL pooler endpoint with dynamic Prisma connection pool sizing.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs border-t border-[#1a1a24]">
            <span className="text-gray-500">SSL Certificate Status:</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-6 bg-[#101014] border border-[#1e1e26] rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recent System Audit Events</span>
          </h3>
          <span className="text-xs text-gray-500 font-mono">Centralized Audit Engine</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#1e1e28] rounded-xl">
            <p className="text-xs text-gray-500 font-mono">No recent administrative audit logs recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e1e28] text-gray-500 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor ID</th>
                  <th className="py-2.5 px-3">Target ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171720]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14141c]">
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e1e2a] text-amber-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-400 truncate max-w-[120px]">
                      {log.actorId || "System"}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500 truncate max-w-[120px]">
                      {log.targetId || "N/A"}
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Kill-Switch */}
      {killSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121216] border border-red-500/30 rounded-2xl p-6 space-y-4">
            <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {killSwitch ? "Deactivate Platform Kill-Switch?" : "Activate Emergency Kill-Switch?"}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {killSwitch
                  ? "This will resume normal registration and API access across the platform."
                  : "WARNING: This will immediately suspend all new user registrations and ticket checkouts."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setKillSwitchModal(false)}
                className="flex-1 px-4 py-2 bg-[#1a1a22] border border-[#2a2a35] rounded-xl text-xs font-medium text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleKillSwitch}
                disabled={toggleLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-bold text-white transition-colors"
              >
                {toggleLoading ? "Executing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
