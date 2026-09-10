"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionCapability } from "@/lib/motionCapability";

/**
 * Mounts heavy WebGL/canvas children only when:
 * - desktop viewport
 * - not prefers-reduced-motion
 * - element is (or was) near the viewport
 * Unmounts when far off-screen to free GPU.
 */
export default function DeferredWebGL({
  children,
  className = "",
  rootMargin = "200px 0px",
  minWidth = 768,
  fallback = null,
}) {
  const { ready, webgl } = useMotionCapability({ minWidth });
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ready || !webgl) {
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
  }, [ready, webgl, rootMargin]);

  const show = ready && webgl && inView;

  return (
    <div ref={ref} className={className} aria-hidden={!show}>
      {show ? children : fallback}
    </div>
  );
}
