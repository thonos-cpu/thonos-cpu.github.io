import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => Response.json(
  { error: "This legacy endpoint has moved to the Vercel application." },
  { status: 410, headers: { "Cache-Control": "no-store" } },
));
