import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders, decryptPayload, json, preflight } from "../_shared/common.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  if (!corsHeaders(request)) return json(request, { error: "Origin not allowed." }, 403);

  const authorization = request.headers.get("authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization || !url || !anonKey) return json(request, { error: "Authentication required." }, 401);

  try {
    const client = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
    if (userError || !userData.user) return json(request, { error: "Authentication required." }, 401);

    const body = await request.json().catch(() => ({})) as { period?: unknown };
    const period = ["day", "month", "year", "all"].includes(String(body.period)) ? String(body.period) : "month";
    const { data, error } = await client.rpc("portfolio_dashboard", { p_period: period });
    if (error) return json(request, { error: "This account is not authorized for the dashboard." }, 403);

    const dashboard = data as { sensitive?: Array<{ encryptedPayload?: string; [key: string]: unknown }> };
    dashboard.sensitive = await Promise.all((dashboard.sensitive || []).map(async (entry) => {
      try {
        return { ...entry, payload: await decryptPayload(String(entry.encryptedPayload || "")), encryptedPayload: undefined };
      } catch {
        return { ...entry, payload: { error: "Unable to decrypt this record." }, encryptedPayload: undefined };
      }
    }));
    return json(request, {
      ...dashboard,
      retention: {
        analyticsDays: Number(Deno.env.get("ANALYTICS_RETENTION_DAYS") || 730),
        sensitiveDays: Number(Deno.env.get("SENSITIVE_LOG_RETENTION_DAYS") || 30),
      },
    });
  } catch (error) {
    console.error("admin_dashboard_failed", error);
    return json(request, { error: "Dashboard data is unavailable." }, 503);
  }
});
