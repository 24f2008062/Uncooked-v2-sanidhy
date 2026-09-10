"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/SupabaseProvider";
import { LayoutDashboard, User, ShieldCheck, CalendarPlus, Settings, ShieldAlert } from "lucide-react";

const BASE_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/create", label: "Create event", icon: CalendarPlus },
  { href: "/host/apply", label: "Host application", icon: ShieldCheck },
];

export default function AccountNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [role, setRole] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const sessionRole = String(
      session?.user?.app_metadata?.role ||
      session?.user?.user_metadata?.role ||
      session?.user?.role ||
      ""
    ).toUpperCase();
    if (sessionRole) {
      setRole(sessionRole);
    }

    let isSubscribed = true;
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isSubscribed && data?.data?.user?.role) {
          setRole(String(data.data.user.role).toUpperCase());
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [session, status]);

  const isSuperAdmin = role === "SUPER_ADMIN";

  const tabs = [
    ...BASE_TABS,
    ...(isSuperAdmin
      ? [{ href: "/admin/dashboard", label: "Admin panel", icon: ShieldAlert, isAdmin: true }]
      : []),
  ];

  return (
    <div className="flex items-center overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-card border border-border-subtle mb-8 max-w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href || (tab.isAdmin && pathname?.startsWith("/admin"));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-colors ${
              active
                ? tab.isAdmin
                  ? "bg-rose-600 text-white shadow-md"
                  : "bg-[var(--accent-orange)] text-white shadow-md"
                : tab.isAdmin
                ? "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
