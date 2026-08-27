"use client";

import { HelpCircle, LifeBuoy } from "lucide-react";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-pink-400" />
          <span>Support Ticket Help Desk</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Resolve attendee support tickets, assign internal staff notes, and manage inquiry queues.
        </p>
      </div>

      <div className="p-8 bg-[#101014] border border-[#1e1e26] rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center mx-auto border border-pink-500/20">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Dual-Thread Support Desk Active</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Public user ticket responses and private staff notes (`isInternal: true`) are isolated under authorization permission `TICKETS_MANAGE`.
        </p>
      </div>
    </div>
  );
}
