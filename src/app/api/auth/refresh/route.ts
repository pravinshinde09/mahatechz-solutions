import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest, type ApiResult } from "@/lib/api/server";
import type { TokenPair } from "@/lib/contracts/auth";
import { clearSessionCookies, cookieNames, writeSessionCookies } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/safe-next";
import { env } from "@/lib/env";

type RefreshResult = ApiResult<{ tokens: TokenPair }>;

// Concurrent requests (two tabs, parallel navigations) can present the same refresh token. The API
// treats a second use as theft and revokes the session, so identical in-flight refreshes share one
// result for a few seconds. In-process only: correct for a single web instance (MVP).
const inflight = new Map<string, { promise: Promise<RefreshResult>; at: number }>();
const SHARE_MS = 10_000;

function refreshOnce(refreshToken: string): Promise<RefreshResult> {
  const key = createHash("sha256").update(refreshToken).digest("hex");
  const now = Date.now();
  for (const [k, v] of inflight) if (now - v.at > SHARE_MS) inflight.delete(k);
  const existing = inflight.get(key);
  if (existing) return existing.promise;
  const promise = apiRequest<{ tokens: TokenPair }>("/auth/refresh", { method: "POST", body: { refreshToken } });
  inflight.set(key, { promise, at: now });
  return promise;
}

/** GET /api/auth/refresh?next=/app/... — rotate tokens, then return to `next` (or go to login). */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const store = await cookies();
  const refreshToken = store.get(cookieNames.refresh)?.value;
  const toLogin = (reason?: string) => {
    clearSessionCookies(store);
    const url = new URL("/login", env.WEB_APP_URL);
    url.searchParams.set("next", next);
    if (reason) url.searchParams.set("reason", reason);
    return NextResponse.redirect(url, 303);
  };

  if (!refreshToken) return toLogin();
  const result = await refreshOnce(refreshToken);
  if (!result.ok) return toLogin(result.error.code === "ACCOUNT_SUSPENDED" ? "suspended" : "expired");

  writeSessionCookies(store, result.data.tokens);
  return NextResponse.redirect(new URL(next, env.WEB_APP_URL), 303);
}
