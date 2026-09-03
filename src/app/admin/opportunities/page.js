"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Building2,
  MapPin,
  DollarSign,
  ArrowUpDown,
  X,
  FileText,
  Clock,
  Send,
  Users
} from "lucide-react";

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [inspectorData, setInspectorData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "INTERNSHIP",
    location: "Remote",
    stipend: "",
    description: "",
    requirements: "",
    deadline: "",
    status: "ACTIVE",
  });

  const [saving, setSaving] = useState(false);

  // Fetch Opportunities
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/v2/admin/opportunities?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Handle Sort Change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      title: "",
      company: "Uncooked Labs",
      type: "INTERNSHIP",
      location: "Remote / Lucknow",
      stipend: "₹15,000 / month",
      description: "",
      requirements: "",
      deadline: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      status: "ACTIVE",
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (opp) => {
    setSelectedOpp(opp);
    setFormData({
      title: opp.title || "",
      company: opp.company || "",
      type: opp.type || "INTERNSHIP",
      location: opp.location || "",
      stipend: opp.stipend || "",
      description: opp.description || "",
      requirements: opp.requirements || "",
      deadline: opp.deadline ? new Date(opp.deadline).toISOString().slice(0, 10) : "",
      status: opp.status || "ACTIVE",
    });
    setShowEditModal(true);
  };

  // Open Inspector Modal
  const handleOpenInspector = async (opp) => {
    setSelectedOpp(opp);
    setShowInspectorModal(true);
    try {
      const res = await fetch(`/api/v2/admin/opportunities/${opp.id}`);
      if (res.ok) {
        const data = await res.json();
        setInspectorData(data.opportunity);
      }
    } catch (err) {
      console.error("Error fetching opportunity detail", err);
    }
  };

  // Submit Create Opportunity
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v2/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create opportunity");
      }
      setShowCreateModal(false);
      fetchOpportunities();
    } catch (err) {
      alert(`Error creating posting: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Opportunity
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/admin/opportunities/${selectedOpp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update opportunity");
      }
      setShowEditModal(false);
      setSelectedOpp(null);
      fetchOpportunities();
    } catch (err) {
      alert(`Error updating posting: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status (ACTIVE <-> CLOSED)
  const handleToggleStatus = async (opp) => {
    const newStatus = opp.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/v2/admin/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOpportunities();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  // Delete Opportunity
  const handleDeleteOpportunity = async (opp) => {
    if (!confirm(`Are you sure you want to delete "${opp.title}"?`)) return;
    try {
      const res = await fetch(`/api/v2/admin/opportunities/${opp.id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchOpportunities();
    } catch (err) {
      alert("Failed to delete opportunity");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            <span>Opportunities & Bounties Control</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage internships, project bounties, research roles, applications, and corporate listings across campus.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101014] border border-[#1e1e26] p-4 rounded-2xl space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search opportunities by title, company, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161f] border border-[#242432] focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#16161f] border border-[#242432] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Listing</option>
              <option value="CLOSED">Closed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#16161f] border border-[#242432] px-3 py-1.5 rounded-xl text-xs">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="INTERNSHIP">Internships</option>
              <option value="BOUNTY">Bounties</option>
              <option value="PROJECT">Projects</option>
              <option value="FULL_TIME">Full Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Data Table */}
      <div className="bg-[#101014] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 font-mono">Loading opportunities catalog...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 italic">No opportunities found matching search parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#16161f] text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#1e1e26]">
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("title")}>
                    <div className="flex items-center gap-1">
                      Role & Organization <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Type & Location</th>
                  <th className="py-3.5 px-4">Stipend / Reward</th>
                  <th className="py-3.5 px-4">Applications</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e26] text-xs">
                {opportunities.map((opp) => {
                  const appCount = opp._count?.applications || 0;

                  return (
                    <tr key={opp.id} className="hover:bg-[#14141d] transition-colors group">
                      {/* Title & Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-purple-400 transition-colors">
                              {opp.title}
                            </p>
                            <p className="text-[11px] text-gray-400">{opp.company}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-semibold">
                            {opp.type}
                          </span>
                          <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            {opp.location}
                          </p>
                        </div>
                      </td>

                      {/* Stipend */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-emerald-400 font-semibold text-xs">
                          {opp.stipend || "Unpaid / Experience"}
                        </span>
                      </td>

                      {/* Applications Count */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenInspector(opp)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181824] border border-[#28283a] text-xs font-mono text-gray-300 hover:text-white transition"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>{appCount} Candidates</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            opp.status === "ACTIVE"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}
                        >
                          {opp.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {opp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspector(opp)}
                            title="Inspect Applications"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252536] text-gray-300 hover:text-purple-400 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(opp)}
                            title="Edit Opportunity"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252536] text-gray-300 hover:text-blue-400 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteOpportunity(opp)}
                            title="Delete Opportunity"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT OPPORTUNITY MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121218] border border-[#262636] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222232] pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <span>{showCreateModal ? "Post New Opportunity" : "Edit Opportunity Details"}</span>
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Opportunity Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    placeholder="e.g. Frontend Developer Intern"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    placeholder="e.g. Uncooked Studio / Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    <option value="INTERNSHIP">Internship</option>
                    <option value="BOUNTY">Bounty</option>
                    <option value="PROJECT">Project</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    placeholder="Remote / Lucknow"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Stipend / Reward</label>
                  <input
                    type="text"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    placeholder="₹15,000 / mo or ₹5,000 bounty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Listing Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    <option value="ACTIVE">Active (Accepting Apps)</option>
                    <option value="CLOSED">Closed</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl p-3 text-white outline-none focus:border-purple-500"
                  placeholder="Outline core responsibilities, project scope, tech stack, and deliverable expectations..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Requirements & Prerequisites</label>
                <textarea
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl p-3 text-white outline-none focus:border-purple-500"
                  placeholder="e.g. Next.js, React, Tailwind, Git experience required..."
                />
              </div>

              <div className="pt-4 border-t border-[#222232] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 rounded-xl bg-[#1c1c28] text-gray-300 font-semibold text-xs hover:bg-[#252536]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : showCreateModal ? "Publish Posting" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICANT INSPECTOR MODAL */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121218] border border-[#262636] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222232] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedOpp?.title}</h3>
                <p className="text-xs text-gray-400">{selectedOpp?.company} &bull; Applicant Submissions</p>
              </div>
              <button onClick={() => setShowInspectorModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inspectorData ? (
              <div className="p-8 text-center text-xs text-gray-400 font-mono">Loading applications...</div>
            ) : inspectorData.applications?.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 italic">No student applications submitted yet for this position.</div>
            ) : (
              <div className="space-y-3">
                {inspectorData.applications.map((app) => (
                  <div key={app.id} className="p-4 bg-[#181824] border border-[#262636] rounded-xl flex items-start justify-between text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">{app.user?.fullName || app.user?.email}</p>
                      <p className="text-gray-400 text-[11px]">{app.user?.email} &bull; {app.user?.department || "General"}</p>
                      {app.coverNote && (
                        <p className="text-gray-300 bg-[#121218] p-2 rounded-lg text-[11px] mt-2 italic">
                          &quot;{app.coverNote}&quot;
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
