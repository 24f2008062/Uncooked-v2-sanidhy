"use client";

import { Settings, Sliders } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-300" />
          <span>System Settings & Feature Flags</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure runtime feature flags, dynamic payment gateways, and homepage marketing overrides without redeployment.
        </p>
      </div>

      <div className="p-8 bg-[#101014] border border-[#1e1e26] rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-gray-500/10 text-gray-300 rounded-full flex items-center justify-center mx-auto border border-gray-500/20">
          <Sliders className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Dynamic Configuration Engine</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          System settings mutations are restricted to `SUPER_ADMIN` accounts under PostgreSQL RLS policy and permission flag `SETTINGS_WRITE`.
        </p>
      </div>
    </div>
  );
}
