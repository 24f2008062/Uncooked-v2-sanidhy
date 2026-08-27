"use client";

import { MessageSquare, Send } from "lucide-react";

export default function AdminCommunicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <span>Communications & Broadcast Hub</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Compose targeted announcements, issue document/media proof requests, and audit applicant responses.
        </p>
      </div>

      <div className="p-8 bg-[#101014] border border-[#1e1e26] rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
          <Send className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Broadcast Desk Operational</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Centralized notifications targeting individual users or user groups (`ALL_USERS`, `VERIFIED_HOSTS`) are governed under permission flag `COMMUNICATIONS_SEND`.
        </p>
      </div>
    </div>
  );
}
