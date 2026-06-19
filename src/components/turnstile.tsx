"use client";

import Script from "next/script";
import { useCallback, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const reactId = useId().replace(/:/g, "");
  const containerId = `turnstile-${reactId}`;
  const rendered = useRef(false);

  const render = useCallback(() => {
    if (!siteKey || !window.turnstile || rendered.current) return;
    rendered.current = true;
    window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [containerId, onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="turnstile-slot" aria-label="Human verification">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
      <div id={containerId} />
    </div>
  );
}
