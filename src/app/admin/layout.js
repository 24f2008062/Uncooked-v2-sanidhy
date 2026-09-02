"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Calendar, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  Briefcase
} from "lucide-react";
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: nextAuthSession } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await fetch("/api/v2/admin/dashboard/stats");
        if (res.ok) {
          setUser(nextAuthSession?.user || { role: "SUPER_ADMIN", email: "admin@uncooked.edu" });
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdminAuth();
  }, [nextAuthSession]);


  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Governance", href: "/admin/users", icon: Users },
    { label: "Host Applications", href: "/admin/applications", icon: FileCheck },
    { label: "Event Moderation", href: "/admin/events", icon: Calendar },
    { label: "Opportunities", href: "/admin/opportunities", icon: Briefcase },
    { label: "Communications", href: "/admin/communications", icon: MessageSquare },
    { label: "Support Desk", href: "/admin/support", icon: HelpCircle },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-mono">Authenticating Admin Workspace...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121215] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-400 mb-6">
            You do not have administrative privileges to access the Uncooked V2 Control Console.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-2.5 bg-[#1a1a1e] border border-[#2a2a30] rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              User Portal
            </Link>
            <Link
              href="/login"
              className="flex-1 px-4 py-2.5 bg-[var(--accent-orange)] rounded-xl text-sm font-medium text-black hover:opacity-90 transition-opacity"
            >
              Re-Authenticate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0d0d10] border-r border-[#1e1e24] flex flex-col fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#1e1e24]">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent-orange)]" />
            <span className="font-bold text-lg tracking-tight text-white">uncooked</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-semibold">
              Admin V2
            </span>
          </Link>
        </div>

        {/* System Health Badge */}
        <div className="px-4 py-3 mx-4 my-3 bg-[#131317] border border-[#22222a] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-gray-300">SYSTEM: NORMAL</span>
          </div>
          <Activity className="w-3.5 h-3.5 text-gray-500" />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#1f1f26] text-white border border-[#30303b] shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#141419]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[var(--accent-orange)]" : "text-gray-400"}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#1e1e24] bg-[#0a0a0d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.email?.split("@")[0] || "Operator"}
              </p>
              <p className="text-[10px] font-mono text-emerald-400 truncate">SUPER_ADMIN</p>
            </div>
            <Link
              href="/"
              title="Exit Console"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a22] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Operational Bar */}
        <header className="h-16 bg-[#0d0d10]/80 backdrop-blur-md border-b border-[#1e1e24] px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">OPERATIONAL CONSOLE</span>
            <span className="text-gray-700">/</span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              {pathname.split("/")[2] || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-[#15151c] border border-[#262633] rounded-lg text-xs font-mono text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>PostgreSQL: Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-8 bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
}
