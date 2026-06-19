import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
let browserClient: SupabaseClient | null | undefined;

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl && publishableKey);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  browserClient = supabaseConfigured()
    ? createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
  return browserClient;
}

export function edgeFunctionUrl(name: string): string {
  return supabaseConfigured() ? `${supabaseUrl}/functions/v1/${name}` : "";
}

export async function invokeEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("This feature is not configured yet.");
  const { data, error } = await client.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    let message = error.message || "The service request failed.";
    const context = "context" in error ? error.context : null;
    if (context instanceof Response) {
      const details = await context.clone().json().catch(() => null) as { error?: string } | null;
      if (details?.error) message = details.error;
    }
    throw new Error(message);
  }
  return data as T;
}

export function sendEdgeFunction(name: string, body: unknown, keepalive = false): Promise<Response> | null {
  const url = edgeFunctionUrl(name);
  if (!url) return null;
  return fetch(url, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    keepalive,
  });
}
