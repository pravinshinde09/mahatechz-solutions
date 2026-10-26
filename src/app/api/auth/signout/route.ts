import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

/**
 * GET /api/auth/signout?reason=suspended — clears local cookies only (no server call), used when a
 * Server Component learns the session is unusable. Harmless if triggered cross-site.
 */
export async function GET(request: NextRequest) {
  clearSessionCookies(await cookies());
  const reason = request.nextUrl.searchParams.get("reason") === "suspended" ? "suspended" : "signed-out";
  return NextResponse.redirect(new URL(`/login?reason=${reason}`, env.WEB_APP_URL), 303);
}
