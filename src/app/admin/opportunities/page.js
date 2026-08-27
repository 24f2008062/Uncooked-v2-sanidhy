"use client";

import { Briefcase, CheckCircle2 } from "lucide-react";

export default function AdminOpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" />
          <span>Opportunities & Candidate Pipeline</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Review internship & bounty postings, evaluate candidate applications, and update hiring stages.
        </p>
      </div>

      <div className="p-8 bg-[#101014] border border-[#1e1e26] rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Opportunities Pipeline Active</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Postings and candidate submissions are accessible via `/api/opportunities` and governed by the V2 security engine.
        </p>
      </div>
    </div>
  );
}
