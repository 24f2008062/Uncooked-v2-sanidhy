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
  AlertCircle
} from "lucide-react";

export default function AdminUserGovernancePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [newRole, setNewRole] = useState("USER");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v2/admin/users", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (roleFilter) url.searchParams.set("role", roleFilter);

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
  }, [search, roleFilter]);

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

  const handleRoleElevate = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v2/admin/users/${selectedUser.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setRoleDrawerOpen(false);
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
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error?.message || data.error || "Action failed");
      }
    } catch (err) {
      alert("Error updating account lock status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>User Governance & Access Control</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage user accounts, elevate roles, grant administrative permissions, and lock compromised credentials.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#101014] p-3 border border-[#1e1e26] rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161c] border border-[#242430] focus:border-[var(--accent-orange)] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-40 bg-[#16161c] border border-[#242430] text-xs text-gray-300 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>

          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#101014] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e1e28] text-gray-400 font-mono uppercase tracking-wider bg-[#131318]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171720]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    Loading users...
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
                          <p className="font-semibold text-white">{u.fullName || "Unnamed User"}</p>
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
                        {u.department || "General"}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                              setRoleDrawerOpen(true);
                            }}
                            title="Edit Role & Access"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252533] text-gray-300 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Role Elevation Drawer / Modal */}
      {roleDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121216] border border-[#252533] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e1e28] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Elevate User Role</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setRoleDrawerOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
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
                  Organiser can create events. Super Admin cannot be granted from this screen.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRoleDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-xl text-xs font-medium text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleElevate}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-[var(--accent-orange)] rounded-xl text-xs font-bold text-black hover:opacity-90 transition-opacity"
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
