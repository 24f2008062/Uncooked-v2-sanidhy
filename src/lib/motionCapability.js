"use client";

import { useEffect, useState } from "react";

/**
 * Client capability gates for heavy animation / WebGL.
 * Keep first paint cheap; enhance when the device can afford it.
 */

export function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getIsDesktopViewport(minWidth = 768) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
}

export function getShouldEnableWebGL(minWidth = 768) {
  if (typeof window === "undefined") return false;
  if (getPrefersReducedMotion()) return false;
  if (!getIsDesktopViewport(minWidth)) return false;
  // Save-Data / low-end hints
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /^(slow-2g|2g)$/i.test(conn.effectiveType)) return false;
  return true;
}

export function useMotionCapability({ minWidth = 768 } = {}) {
  const [state, setState] = useState({
    ready: false,
    reducedMotion: false,
    desktop: false,
    webgl: false,
  });

  useEffect(() => {
    const compute = () => {
      const reducedMotion = getPrefersReducedMotion();
      const desktop = getIsDesktopViewport(minWidth);
      setState({
        ready: true,
        reducedMotion,
        desktop,
        webgl: getShouldEnableWebGL(minWidth),
      });
    };
    compute();

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesktop = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => compute();
    mqReduce.addEventListener?.("change", onChange);
    mqDesktop.addEventListener?.("change", onChange);
    return () => {
      mqReduce.removeEventListener?.("change", onChange);
      mqDesktop.removeEventListener?.("change", onChange);
    };
  }, [minWidth]);

  return state;
}
