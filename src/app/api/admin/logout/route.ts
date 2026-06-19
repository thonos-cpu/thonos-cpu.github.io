import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminSession();
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/login" } });
}
