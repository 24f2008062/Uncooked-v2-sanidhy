"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const CreateEventView = dynamic(() => import("@/components/events/CreateEventView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-400 text-sm">
      Loading event creator…
    </div>
  ),
});

export default function CreatePage() {
  const router = useRouter();

  return (
    <CreateEventView
      isModal={false}
      onClose={() => router.push("/")}
    />
  );
}
