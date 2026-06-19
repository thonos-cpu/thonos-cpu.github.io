"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSyncExternalStore } from "react";

import { ANALYTICS_OPTOUT_KEY } from "@/lib/analytics-client";

function subscribe(callback: () => void) {
  window.addEventListener("analytics-preference-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("analytics-preference-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function enabledSnapshot() {
  return window.localStorage.getItem(ANALYTICS_OPTOUT_KEY) !== "true";
}

export function PerformanceInsights({ deployedOnVercel }: { deployedOnVercel: boolean }) {
  const allowed = useSyncExternalStore(subscribe, enabledSnapshot, () => false);
  return deployedOnVercel && allowed ? <SpeedInsights /> : null;
}
