"use client";

import { useEffect, useState } from "react";
import type { MotionPreference } from "@/lib/shared/types";

export function shouldReduceMotion(preference: MotionPreference, systemPrefersReduced: boolean) {
  if (preference === "reduced") return true;
  if (preference === "full") return false;
  return systemPrefersReduced;
}

export function useReducedMotionPreference(preference: MotionPreference) {
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersReduced(event.matches);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return shouldReduceMotion(preference, systemPrefersReduced);
}
