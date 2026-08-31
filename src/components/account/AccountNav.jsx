"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, ShieldCheck } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/host/apply", label: "Host application", icon: ShieldCheck },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-card border border-border-subtle mb-8">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              active
                ? "bg-[var(--accent-orange)] text-white shadow-md"
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
