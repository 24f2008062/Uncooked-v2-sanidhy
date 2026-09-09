"use client";

import dynamic from "next/dynamic";

const AgentWidget = dynamic(() => import("@/components/ui/AgentWidget"), {
  ssr: false,
  loading: () => null,
});

export default function LazyAgentWidget() {
  return <AgentWidget />;
}
