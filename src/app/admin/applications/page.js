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
  FileText,
  Phone,
  Globe,
  UserCheck,
  ShieldAlert,
  Sparkles
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
                <th className="py-3 px-4">Organization / Club</th>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Contact Info</th>
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
                applications.map((app) => {
                  const notes = app.parsedNotes || {};
                  const repName = notes.applicantName || app.user?.fullName || app.user?.name || "Representative";
                  const repRole = notes.applicantRole || "Lead";
                  const contactEmail = notes.contactEmail || app.user?.email;
                  const contactPhone = notes.contactPhone;

                  return (
                    <tr key={app.id} className="hover:bg-[#14141c] transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-white">{app.organizationName || "Independent Host"}</p>
                          <p className="text-[11px] text-purple-400 font-medium">{app.organizationType || "Student Club"}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-white">{repName}</p>
                          <p className="text-[11px] text-gray-400">{repRole}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        <div>{contactEmail}</div>
                        {contactPhone && <div className="text-[11px] text-gray-500">{contactPhone}</div>}
                      </td>
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
                            setRejectionReason(app.rejectionReason || "");
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1c1c26] border border-[#2a2a3a] hover:border-purple-500 text-xs text-white font-medium flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          <span>Review KYC</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-[#121216] border border-[#252533] rounded-2xl p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e1e28] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>{selectedApp.organizationName || "Host Verification Application"}</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedApp.user?.email}</p>
                <p className="text-xs text-purple-400 font-medium mt-0.5">{selectedApp.organizationType}</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Representative & Contact Information Card */}
              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2.5">
                <h4 className="text-gray-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Representative & Contact Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Full Name:</span>
                    <span className="text-white font-medium">
                      {selectedApp.parsedNotes?.applicantName || selectedApp.user?.fullName || selectedApp.user?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Designation / Role:</span>
                    <span className="text-white font-medium">
                      {selectedApp.parsedNotes?.applicantRole || "Lead Organizer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Official Contact Email:</span>
                    <a
                      href={`mailto:${selectedApp.parsedNotes?.contactEmail || selectedApp.user?.email}`}
                      className="text-purple-300 hover:underline font-mono"
                    >
                      {selectedApp.parsedNotes?.contactEmail || selectedApp.user?.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Contact Phone:</span>
                    <span className="text-white font-mono">
                      {selectedApp.parsedNotes?.contactPhone || "Not provided"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department / Campus:</span>
                  <span className="text-white font-medium">{selectedApp.user?.department || "General"}</span>
                </div>
              </div>

              {/* Verification Proof & Profiles Card */}
              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-2.5">
                <h4 className="text-gray-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Verification Credentials & Proof Links</span>
                </h4>
                <div className="space-y-2">
                  {(selectedApp.parsedNotes?.linkedinUrl || selectedApp.documentUrls) && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">LinkedIn Profile:</span>
                      <a
                        href={selectedApp.parsedNotes?.linkedinUrl || selectedApp.documentUrls}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono truncate max-w-[260px]"
                      >
                        <span>{selectedApp.parsedNotes?.linkedinUrl || selectedApp.documentUrls}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {selectedApp.parsedNotes?.proofDocumentUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Proof Document (ID/Letter):</span>
                      <a
                        href={selectedApp.parsedNotes.proofDocumentUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono truncate max-w-[260px]"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {selectedApp.parsedNotes?.websiteUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Organization Website:</span>
                      <a
                        href={selectedApp.parsedNotes.websiteUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-purple-300 hover:text-purple-200 flex items-center gap-1 font-mono truncate max-w-[260px]"
                      >
                        <span>{selectedApp.parsedNotes.websiteUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {selectedApp.parsedNotes?.instagram && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Instagram:</span>
                      <span className="text-white font-mono">{selectedApp.parsedNotes.instagram}</span>
                    </div>
                  )}
                  {selectedApp.parsedNotes?.twitter && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Twitter / X:</span>
                      <span className="text-white font-mono">{selectedApp.parsedNotes.twitter}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Hosting Purpose Card */}
              <div className="p-3.5 bg-[#181822] border border-[#242434] rounded-xl space-y-1.5">
                <h4 className="text-gray-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Event Hosting Purpose & Planned Events</span>
                </h4>
                <p className="text-gray-300 leading-relaxed bg-[#121218] p-2.5 rounded-lg border border-[#20202c]">
                  {selectedApp.parsedNotes?.hostingReason || selectedApp.notes || selectedApp.description || "No specific hosting description provided."}
                </p>
              </div>

              {/* Rejection Feedback Input */}
              {selectedApp.status === "PENDING" && (
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Feedback if Rejecting (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Please provide a clear college ID or official club authorization link..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-[#181820] border border-[#282836] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              {selectedApp.rejectionReason && selectedApp.status === "REJECTED" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                  <span className="font-semibold block mb-0.5">Rejection Reason Given:</span>
                  <p>{selectedApp.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {selectedApp.status === "PENDING" ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleReview("REJECT")}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Reject Application"}
                </button>
                <button
                  onClick={() => handleReview("APPROVE")}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {actionLoading ? "Processing..." : "Approve & Grant Organizer Role"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-[#161620] border border-[#242432] rounded-xl">
                <div className="text-xs text-gray-400 font-mono">
                  Current Status: <span className="font-bold text-white uppercase">{selectedApp.status}</span>
                </div>
                {selectedApp.status === "REJECTED" && (
                  <button
                    onClick={() => handleReview("APPROVE")}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Re-approve Host
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
