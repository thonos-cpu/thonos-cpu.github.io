"use client";

import { useSyncExternalStore } from "react";

import { analyticsOptedOut, setAnalyticsOptOut } from "@/lib/analytics-client";

export function PrivacyControls() {
  const optedOut = useSyncExternalStore(
    (notify) => {
      window.addEventListener("analytics-preference-changed", notify);
      window.addEventListener("storage", notify);
      return () => {
        window.removeEventListener("analytics-preference-changed", notify);
        window.removeEventListener("storage", notify);
      };
    },
    analyticsOptedOut,
    () => false,
  );
  return (
    <div className="privacy-control">
      <div><strong>Anonymous usage analytics</strong><p>Page, section, and foreground-time events. No raw IP address is stored.</p></div>
      <button type="button" aria-pressed={!optedOut} onClick={() => setAnalyticsOptOut(!optedOut)}>
        {optedOut ? "Enable analytics" : "Disable analytics"}
      </button>
    </div>
  );
}
