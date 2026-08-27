"use client";

import { Calendar, Shield, Sparkles } from "lucide-react";

export default function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-amber-400" />
          <span>Global Event Moderation Desk</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor all campus events, override active status, toggle homepage highlights, and manage event staff assignments.
        </p>
      </div>

      <div className="p-8 bg-[#101014] border border-[#1e1e26] rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Event Moderation Engine Active</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          All published events are governed under central V2 RBAC policies (`EVENTS_MODERATE`). Staff assignment and refund triggers are fully operational.
        </p>
      </div>
    </div>
  );
}
