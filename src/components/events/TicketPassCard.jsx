"use client";

import dynamic from "next/dynamic";
import GoogleMapsButton from "@/components/ui/GoogleMapsButton";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => <div className="w-24 h-24 bg-zinc-200 rounded-lg animate-pulse" />,
  }
);

export default function TicketPassCard({ title, status, location, dateLabel, payload, passId }) {
  return (
    <div className="bg-background border border-border-subtle rounded-2xl p-4 flex items-center gap-4">
      <div className="p-2 bg-white rounded-xl shrink-0">
        {payload ? (
          <QRCodeSVG value={payload} size={96} level="M" />
        ) : (
          <div className="w-24 h-24 bg-zinc-200 rounded-lg" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">{status || "Confirmed"}</p>
        <h4 className="text-sm font-bold text-text-primary truncate">{title}</h4>
        <p className="text-[11px] text-text-secondary mt-1">{dateLabel}</p>
        <p className="text-[11px] text-text-secondary truncate">{location}</p>
        {location && (
          <div className="mt-1">
            <GoogleMapsButton
              location={location}
              label="Open in Maps"
              variant="badge"
              className="!py-0.5 !px-2 !text-[10px]"
            />
          </div>
        )}
        <p className="text-[10px] font-mono text-[var(--accent-orange)] mt-1.5 truncate">PASS {passId}</p>
      </div>
    </div>
  );
}
