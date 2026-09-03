"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  MapPin,
  Tag,
  DollarSign,
  ArrowUpDown,
  Sparkles,
  X,
  ExternalLink,
  PauseCircle,
  PlayCircle
} from "lucide-react";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);

  // Form State (Create/Edit)
  const [formData, setFormData] = useState({
    title: "",
    type: "General",
    category: "Campus",
    description: "",
    location: "Campus Auditorium",
    date: "",
    ticketType: "Free",
    price: 0,
    bannerUrl: "",
    prizePool: "",
    status: "Active",
  });

  const [saving, setSaving] = useState(false);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/v2/admin/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
      type: "Hackathon",
      category: "Tech",
      description: "",
      location: "Main Auditorium, Campus",
      city: "Lucknow",
      state: "Uttar Pradesh",
      date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
      capacity: 250,
      ticketType: "Free",
      price: 0,
      bannerUrl: "",
      prizePool: "₹50,000",
      status: "Active",
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (evt) => {
    setSelectedEvent(evt);
    setFormData({
      title: evt.title || "",
      type: evt.type || "General",
      category: evt.category || "Campus",
      description: evt.description || "",
      location: evt.location || "",
      city: evt.city || "Lucknow",
      state: evt.state || "Uttar Pradesh",
      date: evt.date ? new Date(evt.date).toISOString().slice(0, 16) : "",
      capacity: evt.capacity || 100,
      ticketType: evt.ticketType || "Free",
      price: evt.price || 0,
      bannerUrl: evt.bannerUrl || "",
      prizePool: evt.prizePool || "",
      status: evt.status || "Active",
    });
    setShowEditModal(true);
  };

  // Submit Create Event
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v2/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create event");
      }
      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      alert(`Error creating event: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Event
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v2/admin/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update event");
      }
      setShowEditModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      alert(`Error updating event: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Event Status (Active <-> Paused)
  const handleToggleStatus = async (evt) => {
    const newStatus = evt.status === "Active" ? "Paused" : "Active";
    try {
      const res = await fetch(`/api/v2/admin/events/${evt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (evt) => {
    if (!confirm(`Are you sure you want to delete "${evt.title}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v2/admin/events/${evt.id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      alert("Failed to delete event");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Title & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" />
            <span>Event Management & Operations</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Full administrative control over campus events, hackathons, workshops, host credentials, and registrations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101014] border border-[#1e1e26] p-4 rounded-2xl space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161f] border border-[#242432] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
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
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#16161f] border border-[#242432] px-3 py-1.5 rounded-xl text-xs">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Tech">Tech & Coding</option>
              <option value="Campus">Campus & Student</option>
              <option value="Cultural">Cultural & Arts</option>
              <option value="Workshop">Workshops</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Data Table */}
      <div className="bg-[#101014] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 font-mono">Loading campus events...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 italic">No events found matching current criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#16161f] text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#1e1e26]">
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("title")}>
                    <div className="flex items-center gap-1">
                      Event Title <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Category & Type</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">
                      Date & Location <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Registrations</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e26] text-xs">
                {events.map((evt) => {
                  const regCount = evt._count?.registrations || 0;
                  const isFull = regCount >= evt.capacity;

                  return (
                    <tr key={evt.id} className="hover:bg-[#14141d] transition-colors group">
                      {/* Title & Banner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {evt.bannerUrl ? (
                            <img
                              src={evt.bannerUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-[#2a2a3a] shrink-0"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                              {evt.title.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {evt.title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate max-w-xs">
                              Created by: {evt.createdBy?.fullName || evt.createdBy?.email || "System Admin"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                            {evt.category || "General"}
                          </span>
                          <p className="text-gray-400 text-[11px]">{evt.type}</p>
                        </div>
                      </td>

                      {/* Date & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-gray-200 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            {new Date(evt.date).toLocaleDateString()}
                          </p>
                          <p className="text-[#a1a1aa] text-[11px] flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            {evt.location}, {evt.city}
                          </p>
                        </div>
                      </td>

                      {/* Registrations */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-bold">{regCount}</span>
                            <span className="text-gray-500">/ {evt.capacity} seats</span>
                          </div>
                          <div className="w-24 bg-[#1e1e2c] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(100, (regCount / evt.capacity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            evt.status === "Active"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : evt.status === "Paused"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                          }`}
                        >
                          {evt.status === "Active" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <PauseCircle className="w-3 h-3" />
                          )}
                          {evt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(evt)}
                            title={evt.status === "Active" ? "Pause Event" : "Activate Event"}
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252536] text-gray-300 hover:text-amber-400 transition"
                          >
                            {evt.status === "Active" ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(evt)}
                            title="Edit Event"
                            className="p-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252536] text-gray-300 hover:text-blue-400 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            title="Delete Event"
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

      {/* CREATE & EDIT EVENT MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121218] border border-[#262636] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222232] pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>{showCreateModal ? "Create Campus Event" : "Edit Event Operations"}</span>
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
                  <label className="block text-gray-300 font-semibold mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Uncooked Hackathon 2026"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="Tech">Tech & Coding</option>
                    <option value="Campus">Campus & Student</option>
                    <option value="Cultural">Cultural & Arts</option>
                    <option value="Workshop">Workshop & Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. Main Auditorium, Block C"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Prize Pool / Rewards</label>
                  <input
                    type="text"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                    className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    placeholder="e.g. ₹50,000 Pool + Swag"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                  className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono text-[11px]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Event Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#181824] border border-[#2a2a3c] rounded-xl p-3 text-white outline-none focus:border-amber-500"
                  placeholder="Provide comprehensive details about schedule, guidelines, prerequisites..."
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
                  className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : showCreateModal ? "Publish Event" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
