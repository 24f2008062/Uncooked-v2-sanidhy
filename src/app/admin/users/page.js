"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  Lock, 
  Unlock, 
  Edit3, 
  Check, 
  X,
  ArrowUpDown,
  Mail,
  KeyRound,
  Eye,
  Info,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Send
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminUserGovernancePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Inspector Drawer & Action States
  const [inspectorUser, setInspectorUser] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState("USER");
  const [actionLoading, setActionLoading] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v2/admin/users", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (roleFilter) url.searchParams.set("role", roleFilter);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortOrder", sortOrder);

      const res = await fetch(url.toString());
      const payload = await res.json();
      const data = payload.data || payload;
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchUsers();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleRoleElevate = async () => {
    if (!roleModalUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v2/admin/users/${roleModalUser.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setNoticeMsg({ type: "success", text: `Updated ${roleModalUser.email} role to ${newRole}` });
        setRoleModalUser(null);
        fetchUsers();
      } else {
        alert(data.error?.message || data.error || "Failed to update role");
      }
    } catch (err) {
      alert("Error updating role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (user) => {
    const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
    const action = isLocked ? "unlock" : "lock";
    if (!confirm(`Are you sure you want to ${action} user ${user.email}?`)) return;

    try {
      const res = await fetch(`/api/v2/admin/users/${user.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: !isLocked, hours: 24 }),
      });
      if (res.ok) {
        setNoticeMsg({ type: "success", text: `Account ${action}ed successfully.` });
        fetchUsers();
        if (inspectorUser?.id === user.id) {
          setInspectorUser(null);
        }
      } else {
        const data = await res.json();
        alert(data.error?.message || data.error || "Action failed");
      }
    } catch (err) {
      alert("Error updating account lock status");
    }
  };

  const handleSendResetPassword = async (email) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setNoticeMsg({ type: "success", text: `Password reset link dispatched to ${email}` });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send reset email");
      }
    } catch (err) {
      alert("Error triggering password reset");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>User Governance & Access Control</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, sort, audit, elevate roles, and inspect granular profile security for all platform users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#14141c] border border-[#242434] text-gray-300">
            Total Matched: <strong className="text-white">{users.length}</strong>
          </span>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{noticeMsg.text}</span>
          </div>
          <button onClick={() => setNoticeMsg(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Sorting Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-[#101014] p-3 border border-[#1e1e26] rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, department, or club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161c] border border-[#242430] focus:border-[var(--accent-orange)] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-36 bg-[#16161c] border border-[#242430] text-xs text-gray-300 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-[#16161c] border border-[#242430] rounded-xl px-2 py-1">
            <span className="text-[11px] text-gray-400 font-mono pl-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer py-1"
            >
              <option value="createdAt" className="bg-[#16161c]">Joined Date</option>
              <option value="fullName" className="bg-[#16161c]">Name</option>
              <option value="email" className="bg-[#16161c]">Email</option>
              <option value="role" className="bg-[#16161c]">Role</option>
              <option value="department" className="bg-[#16161c]">Department</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Toggle direction (${sortOrder.toUpperCase()})`}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#242434] transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#101014] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e1e28] text-gray-400 font-mono uppercase tracking-wider bg-[#131318]">
                <th 
                  onClick={() => handleSortChange("fullName")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  User Name & Email {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => handleSortChange("role")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  Role {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  onClick={() => handleSortChange("department")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  Department / Club {sortBy === "department" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="py-3 px-4">Status</th>
                <th 
                  onClick={() => handleSortChange("createdAt")}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  Joined {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="py-3 px-4 text-right">Actions & Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171720]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    Fetching user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    No users match current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                  return (
                    <tr key={u.id} className="hover:bg-[#14141c] transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-white">{u.fullName || u.name || "Unnamed User"}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : u.role === "ADMIN"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : u.role === "ORGANIZER"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {u.department || u.clubAssociation || "General"}
                      </td>
                      <td className="py-3.5 px-4">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Profile */}
                          <button
                            onClick={() => setInspectorUser(u)}
                            title="Inspect Detailed Profile"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252533] text-gray-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {/* Direct Email */}
                          <button
                            onClick={() => router.push(`/admin/communications?email=${encodeURIComponent(u.email)}`)}
                            title="Compose Direct Email"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252533] text-gray-300 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          {/* Role Edit */}
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setNewRole(u.role);
                            }}
                            title="Edit Role & Permissions"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252533] text-gray-300 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Account Lock/Unlock */}
                          <button
                            onClick={() => handleToggleLock(u)}
                            title={isLocked ? "Unlock Account" : "Lock Account"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLocked
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Inspector Modal */}
      {inspectorUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#121216] border border-[#252533] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e1e28] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>User Profile Control & Audit</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{inspectorUser.email}</p>
              </div>
              <button onClick={() => setInspectorUser(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2">
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider">Account Information</p>
                <div className="space-y-1">
                  <p className="text-white font-semibold">{inspectorUser.fullName || inspectorUser.name || "N/A"}</p>
                  <p className="text-gray-400 font-mono text-[11px]">{inspectorUser.email}</p>
                  <p className="text-gray-400">Phone: {inspectorUser.phoneE164 || "Not provided"}</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2">
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider">Campus Details</p>
                <div className="space-y-1">
                  <p className="text-white font-medium">Department: {inspectorUser.department || "General"}</p>
                  <p className="text-gray-400">Club: {inspectorUser.clubAssociation || "None"}</p>
                  <p className="text-gray-400">Onboarded: {inspectorUser.onboardingCompleted ? "Yes" : "No"}</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2">
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider">Security & Auth</p>
                <div className="space-y-1">
                  <p className="text-white font-mono">Role: <strong className="text-amber-400">{inspectorUser.role}</strong></p>
                  <p className="text-gray-400">Auth Migration: {inspectorUser.authUserId ? "Supabase Linked" : "Legacy DB"}</p>
                  <p className="text-gray-400">Failed Logins: {inspectorUser.failedLoginAttempts || 0}</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2">
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider">Timestamps</p>
                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-gray-300">Joined: {new Date(inspectorUser.createdAt).toLocaleString()}</p>
                  <p className="text-gray-400">Last Active: {inspectorUser.lastLoginAt ? new Date(inspectorUser.lastLoginAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="border-t border-[#1e1e28] pt-4 space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const email = inspectorUser.email;
                    setInspectorUser(null);
                    router.push(`/admin/communications?email=${encodeURIComponent(email)}`);
                  }}
                  className="px-3 py-2 bg-[#1b1b26] border border-[#2a2a3a] hover:border-emerald-500 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>

                <button
                  onClick={() => handleSendResetPassword(inspectorUser.email)}
                  className="px-3 py-2 bg-[#1b1b26] border border-[#2a2a3a] hover:border-amber-500 text-amber-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset Password</span>
                </button>

                <button
                  onClick={() => handleToggleLock(inspectorUser)}
                  className="px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Toggle Lock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Elevation Drawer / Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121216] border border-[#252533] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e1e28] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Elevate User Role</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{roleModalUser.email}</p>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  Select Role Target
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-[#181820] border border-[#2a2a38] text-xs text-white rounded-xl p-3 outline-none"
                >
                  <option value="USER">USER (Standard Member)</option>
                  <option value="ORGANIZER">ORGANIZER (Event Host)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#16161f] border border-[#222230] text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Security Impact Notice
                </p>
                <p>
                  Organizers gain event publishing access. Super Admin role cannot be granted from this console.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-xl text-xs font-medium text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleElevate}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-[var(--accent-orange)] rounded-xl text-xs font-bold text-black hover:opacity-90 transition-opacity cursor-pointer"
              >
                {actionLoading ? "Updating..." : "Save Role Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
