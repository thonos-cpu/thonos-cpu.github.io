import { NextResponse } from "next/server";

import { setAdminSession, verifyAdminPassword } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/security";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, 6, 15 * 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 303, headers: { Location: "/admin/login?error=locked" } });

  const form = await request.formData();
  const username = String(form.get("username") || "").slice(0, 100);
  const password = String(form.get("password") || "").slice(0, 500);
  const configuredUsername = process.env.ADMIN_USERNAME;
  const valid = Boolean(configuredUsername)
    && username === configuredUsername
    && verifyAdminPassword(password);

  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return new NextResponse(null, { status: 303, headers: { Location: "/admin/login?error=invalid" } });
  }

  await setAdminSession(username);
  return new NextResponse(null, { status: 303, headers: { Location: "/admin" } });
}
