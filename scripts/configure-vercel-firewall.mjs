const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_ORG_ID;

if (!token || !projectId || !teamId) {
  throw new Error("VERCEL_TOKEN, VERCEL_PROJECT_ID, and VERCEL_ORG_ID are required.");
}

const query = `projectId=${encodeURIComponent(projectId)}&teamId=${encodeURIComponent(teamId)}`;
const endpoint = `https://api.vercel.com/v1/security/firewall/config?${query}`;
const activeEndpoint = `https://api.vercel.com/v1/security/firewall/config/active?${query}`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function request(method, body, active = false) {
  const response = await fetch(active ? activeEndpoint : endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Vercel Firewall ${method} failed (${response.status}): ${JSON.stringify(result)}`);
  return result;
}

const current = await request("GET", null, true);
const existingNames = new Set((current.rules || current.config?.rules || []).map((rule) => rule.name));

await request("PATCH", { action: "firewallEnabled", value: true });
await request("PATCH", { action: "managedRules.update", id: "bot_protection", value: { active: true, action: "challenge" } });
await request("PATCH", { action: "managedRules.update", id: "ai_bots", value: { active: true, action: "deny" } });

const rules = [
  {
    name: "Block common exploit scanners",
    active: true,
    conditionGroup: [{ conditions: [{ type: "path", op: "re", value: "^/(wp-(admin|login|content|includes)|phpmyadmin|\\.env|\\.git)(/|$)" }] }],
    action: { mitigate: { action: "deny", actionDuration: "1h" } },
  },
  {
    name: "Challenge obvious scraping clients",
    active: true,
    conditionGroup: [{ conditions: [{ type: "user_agent", op: "re", value: "^(curl|Wget|python-requests|Scrapy|python-httpx|aiohttp|Go-http-client)/" }] }],
    action: { mitigate: { action: "challenge", actionDuration: "10m" } },
  },
  {
    name: "Global per-IP request ceiling",
    active: true,
    conditionGroup: [{ conditions: [{ type: "path", op: "pre", value: "/" }] }],
    action: { mitigate: { action: "rate_limit", rateLimit: { algo: "fixed_window", window: 60, limit: 180, keys: ["ip"], action: "challenge" } } },
  },
];

for (const rule of rules) {
  if (!existingNames.has(rule.name)) await request("PATCH", { action: "rules.insert", value: rule });
}

console.log("Vercel Firewall baseline is active.");
