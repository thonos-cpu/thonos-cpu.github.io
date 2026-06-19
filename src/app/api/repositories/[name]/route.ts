import { getRepositoryReadme } from "@/lib/github";
import { clientIp, rateLimit, safeJsonHeaders } from "@/lib/security";

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const ip = clientIp(request);
  const limit = rateLimit(`readme:${ip}`, 30, 60_000);
  if (!limit.ok) return Response.json({ error: "Too many requests." }, { status: 429, headers: safeJsonHeaders({ "Retry-After": String(limit.retryAfter) }) });
  const { name } = await params;
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(name)) return Response.json({ error: "Invalid repository." }, { status: 400, headers: safeJsonHeaders() });
  const readme = await getRepositoryReadme(name);
  if (!readme) return Response.json({ readme: null }, { status: 404, headers: safeJsonHeaders() });
  return Response.json({ readme }, { headers: { ...safeJsonHeaders(), "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
