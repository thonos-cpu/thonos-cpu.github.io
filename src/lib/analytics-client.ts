export const ANALYTICS_OPTOUT_KEY = "tasis.analytics.optout";
const SESSION_KEY = "tasis.analytics.session";

export function analyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  let value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function analyticsOptedOut(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "true";
}

export function setAnalyticsOptOut(optOut: boolean): void {
  window.localStorage.setItem(ANALYTICS_OPTOUT_KEY, String(optOut));
  window.dispatchEvent(new CustomEvent("analytics-preference-changed"));
}
