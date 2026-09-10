"use client";

import { useEffect, useState } from "react";

/**
 * Client capability gates for heavy animation / WebGL.
 * Keep first paint cheap; enhance when the device can afford it.
 *
 * Desktop: full WebGL when motion + network allow.
 * Mobile (opt-in via allowMobile): lite WebGL after idle — still blocked by
 * prefers-reduced-motion, Save-Data, and slow-2g/2g.
 */

export function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getIsDesktopViewport(minWidth = 768) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
}

export function getNetworkAllowsHeavyFx() {
  if (typeof window === "undefined") return false;
  const conn =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /^(slow-2g|2g)$/i.test(conn.effectiveType)) return false;
  return true;
}

/**
 * @param {number} [minWidth=768]
 * @param {{ allowMobile?: boolean }} [options]
 */
export function getShouldEnableWebGL(minWidth = 768, { allowMobile = false } = {}) {
  if (typeof window === "undefined") return false;
  if (getPrefersReducedMotion()) return false;
  if (!getNetworkAllowsHeavyFx()) return false;
  if (getIsDesktopViewport(minWidth)) return true;
  return Boolean(allowMobile);
}

export function useMotionCapability({ minWidth = 768, allowMobile = false } = {}) {
  const [state, setState] = useState({
    ready: false,
    reducedMotion: false,
    desktop: false,
    webgl: false,
    allowMobile: Boolean(allowMobile),
  });

  useEffect(() => {
    const compute = () => {
      const reducedMotion = getPrefersReducedMotion();
      const desktop = getIsDesktopViewport(minWidth);
      setState({
        ready: true,
        reducedMotion,
        desktop,
        webgl: getShouldEnableWebGL(minWidth, { allowMobile }),
        allowMobile: Boolean(allowMobile),
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
  }, [minWidth, allowMobile]);

  return state;
}
