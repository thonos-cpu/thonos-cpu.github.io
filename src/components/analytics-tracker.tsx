"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { analyticsOptedOut, analyticsSessionId } from "@/lib/analytics-client";

const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

type EventPayload = {
  sessionId: string;
  eventType: "page_view" | "section_view" | "heartbeat" | "duration";
  path: string;
  section?: string;
  durationSeconds?: number;
  referrer?: string;
  deviceClass?: "mobile" | "tablet" | "desktop";
};

function send(payload: EventPayload, beacon = false) {
  if (!enabled || analyticsOptedOut() || payload.path.startsWith("/admin")) return;
  const body = JSON.stringify(payload);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

function deviceClass(): "mobile" | "tablet" | "desktop" {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || pathname.startsWith("/admin") || analyticsOptedOut()) return;
    const sessionId = analyticsSessionId();
    const path = pathname.slice(0, 240);
    let foregroundSeconds = 0;
    let activeSince = document.visibilityState === "visible" ? performance.now() : null;
    const viewedSections = new Set<string>();

    send({ sessionId, eventType: "page_view", path, referrer: document.referrer, deviceClass: deviceClass() });

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") send({ sessionId, eventType: "heartbeat", path });
    }, 30_000);

    const visibility = () => {
      if (document.visibilityState === "hidden" && activeSince !== null) {
        foregroundSeconds += (performance.now() - activeSince) / 1000;
        activeSince = null;
      } else if (document.visibilityState === "visible" && activeSince === null) {
        activeSince = performance.now();
      }
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const section = entry.target.id;
        if (entry.isIntersecting && section && !viewedSections.has(section)) {
          viewedSections.add(section);
          send({ sessionId, eventType: "section_view", path, section });
        }
      }
    }, { threshold: .55 });
    document.querySelectorAll<HTMLElement>("main section[id]").forEach((section) => observer.observe(section));

    const finish = () => {
      if (activeSince !== null) foregroundSeconds += (performance.now() - activeSince) / 1000;
      send({ sessionId, eventType: "duration", path, durationSeconds: Math.round(foregroundSeconds) }, true);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", finish, { once: true });

    return () => {
      window.clearInterval(heartbeat);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, [pathname]);

  return null;
}
