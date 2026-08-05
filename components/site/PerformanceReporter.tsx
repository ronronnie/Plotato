"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/client/analytics";

export function PerformanceReporter() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const paints = performance.getEntriesByType("paint");
      const firstPaint = paints.find((entry) => entry.name === "first-paint");
      const firstContentfulPaint = paints.find((entry) => entry.name === "first-contentful-paint");
      trackEvent("performance_sample", {
        performance_sample: true,
        dom_content_loaded_ms: Math.round(navigation?.domContentLoadedEventEnd ?? 0),
        load_ms: Math.round(navigation?.loadEventEnd ?? 0),
        first_paint_ms: Math.round(firstPaint?.startTime ?? 0),
        first_contentful_paint_ms: Math.round(firstContentfulPaint?.startTime ?? 0),
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
