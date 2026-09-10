"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reports Core Web Vitals (CLS, INP, LCP, FCP, TTFB) to the console in
 * development and to `window.__opportiaWebVitals` for RUM / debugging.
 * Keep this zero-network by default — wire to analytics later if needed.
 */
export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined") return;

    const entry = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      ts: Date.now(),
    };

    const bag = Array.isArray(window.__opportiaWebVitals)
      ? window.__opportiaWebVitals
      : [];
    bag.push(entry);
    window.__opportiaWebVitals = bag.slice(-40);

    if (process.env.NODE_ENV === "development") {
      console.debug("[web-vital]", metric.name, Math.round(metric.value), metric.rating);
    }
  });

  return null;
}
