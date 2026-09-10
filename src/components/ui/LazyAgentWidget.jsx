"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionCapability } from "@/lib/motionCapability";

const AgentWidget = dynamic(() => import("@/components/ui/AgentWidget"), {
  ssr: false,
  loading: () => null,
});

/**
 * Mobile: skip entirely (saves JS + main-thread work).
 * Desktop: mount after idle so it doesn't compete with LCP.
 */
export default function LazyAgentWidget() {
  const { ready, desktop, reducedMotion } = useMotionCapability({ minWidth: 768 });
  const [idleReady, setIdleReady] = useState(false);

  useEffect(() => {
    if (!ready || !desktop || reducedMotion) return undefined;
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setIdleReady(true);
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(enable, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const t = setTimeout(enable, 1800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, desktop, reducedMotion]);

  if (!ready || !desktop || reducedMotion || !idleReady) return null;
  return <AgentWidget />;
}
