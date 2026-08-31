"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ExternalLink, 
  Building, 
  Mail, 
  FileText 
} from "lucide-react";

export default function AdminHostApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v2/admin/applications", window.location.origin);
      if (statusFilter) url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const payload = await res.json();
      const data = payload.data || payload;
      if (res.ok) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchApplications();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchApplications]);

  const handleReview = async (action) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v2/admin/applications/${selectedApp.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "REJECT" ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewModalOpen(false);
        fetchApplications();
      } else {
        alert(data.error?.message || data.error || "Review action failed");
      }
    } catch (err) {
      alert("Error reviewing application");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-purple-400" />
            <span>Host Verification & KYC Desk</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review club & event host applications, verify uploaded KYC proof documents, and grant Organizer hosting privileges.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-[#101014] p-3 border border-[#1e1e26] rounded-2xl">
        <Filter className="w-4 h-4 text-gray-500 ml-2" />
        <span className="text-xs text-gray-400 font-medium">Filter Queue:</span>
        <div className="flex items-center gap-2">
          {["PENDING", "APPROVED", "REJECTED", ""].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[var(--accent-orange)] text-black font-bold"
                  : "bg-[#181820] text-gray-400 border border-[#262634] hover:text-white"
              }`}
            >
              {st || "ALL"}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#101014] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e1e28] text-gray-400 font-mono uppercase tracking-wider bg-[#131318]">
                <th className="py-3 px-4">Organization / Host</th>
                <th className="py-3 px-4">Applicant Email</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171720]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    Loading host applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    No applications found in this filter status.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#14141c] transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{app.organizationName || "Independent Host"}</p>
                        <p className="text-[11px] text-gray-400">{app.user?.fullName || "User"}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{app.user?.email || app.email}</td>
                    <td className="py-3.5 px-4 text-gray-300">{app.category || "Student Club"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                          app.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : app.status === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#1c1c26] border border-[#2a2a3a] hover:border-[var(--accent-orange)] text-xs text-white font-medium flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                        <span>Review KYC</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#121216] border border-[#252533] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e1e28] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>{selectedApp.organizationName || "Host Verification"}</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedApp.user?.email}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#181822] border border-[#242434] rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Applicant Full Name:</span>
                  <span className="text-white font-medium">{selectedApp.user?.fullName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department / Campus:</span>
                  <span className="text-white font-medium">{selectedApp.user?.department || "General"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Application Category:</span>
                  <span className="text-purple-400 font-semibold">{selectedApp.category || "Club"}</span>
                </div>
              </div>

              {selectedApp.description && (
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Host Description:</label>
                  <p className="p-3 bg-[#16161f] border border-[#222230] rounded-xl text-gray-300 leading-relaxed">
                    {selectedApp.description}
                  </p>
                </div>
              )}

              {selectedApp.status === "PENDING" && (
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Optional Rejection Reason:</label>
                  <input
                    type="text"
                    placeholder="Provide specific feedback if rejecting..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-[#181820] border border-[#282836] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>
              )}
            </div>

            {selectedApp.status === "PENDING" ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleReview("REJECT")}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  {actionLoading ? "Processing..." : "Reject Application"}
                </button>
                <button
                  onClick={() => handleReview("APPROVE")}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all"
                >
                  {actionLoading ? "Processing..." : "Approve & Elevate Role"}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[#161620] border border-[#242432] rounded-xl text-center text-xs text-gray-400 font-mono">
                This application has already been marked as <span className="font-bold text-white">{selectedApp.status}</span>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
