import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/server";
import type { TokenPair } from "@/lib/contracts/auth";
import { clearSessionCookies, cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

const sameOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  return origin === new URL(env.WEB_APP_URL).origin || request.headers.get("sec-fetch-site") === "same-origin";
};

/**
 * POST /api/auth/logout (plain form post). Lives under /api/auth so it receives the refresh
 * cookie: if the access token already expired, it rotates once to be able to revoke the session.
 * `?all=1` signs out every device.
 */
export async function POST(request: NextRequest) {
  // CSRF: state-changing BFF route — require a same-origin request (spec §18.3).
  if (!sameOrigin(request)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });

  const store = await cookies();
  let accessToken = store.get(cookieNames.access)?.value;
  const refreshToken = store.get(cookieNames.refresh)?.value;
  if (!accessToken && refreshToken) {
    const refreshed = await apiRequest<{ tokens: TokenPair }>("/auth/refresh", { method: "POST", body: { refreshToken } });
    if (refreshed.ok) accessToken = refreshed.data.tokens.accessToken;
  }
  if (accessToken) {
    const all = request.nextUrl.searchParams.get("all") === "1";
    await apiRequest(all ? "/auth/logout-all" : "/auth/logout", { method: "POST", accessToken });
  }

  clearSessionCookies(store);
  return NextResponse.redirect(new URL("/login?reason=signed-out", env.WEB_APP_URL), 303);
}
