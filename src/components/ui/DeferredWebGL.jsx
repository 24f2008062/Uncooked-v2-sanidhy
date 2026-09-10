"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionCapability } from "@/lib/motionCapability";

/**
 * Mounts heavy WebGL/canvas children only when:
 * - motion + network allow (see motionCapability)
 * - desktop, OR allowMobile=true (lite path)
 * - element is near the viewport
 * - on mobile lite path: after idle so LCP/INP stay clean
 * Unmounts when far off-screen to free GPU.
 */
export default function DeferredWebGL({
  children,
  className = "",
  rootMargin = "200px 0px",
  minWidth = 768,
  allowMobile = false,
  mobileIdleMs = 1400,
  fallback = null,
}) {
  const { ready, webgl, desktop } = useMotionCapability({ minWidth, allowMobile });
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [idleOk, setIdleOk] = useState(false);

  useEffect(() => {
    if (!ready || !webgl) {
      setIdleOk(false);
      return undefined;
    }
    // Desktop: mount as soon as capability says yes.
    if (desktop || !allowMobile) {
      setIdleOk(true);
      return undefined;
    }
    // Mobile lite: wait for idle so first paint / scroll stay smooth.
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setIdleOk(true);
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(enable, { timeout: mobileIdleMs });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const t = setTimeout(enable, Math.min(mobileIdleMs, 1800));
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ready, webgl, desktop, allowMobile, mobileIdleMs]);

  useEffect(() => {
    if (!ready || !webgl || !idleOk) {
      setInView(false);
      return undefined;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting));
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, webgl, idleOk, rootMargin]);

  const show = ready && webgl && idleOk && inView;

  return (
    <div ref={ref} className={className} aria-hidden={!show}>
      {show ? children : fallback}
    </div>
  );
}
