import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

// Player events from the browser (spec §15.5). The access token stays in its HttpOnly cookie; this
// handler forwards the event to the API. Only these actions exist — no generic proxy.
const actions = {
  start: { method: "POST", path: "progress/start" },
  heartbeat: { method: "POST", path: "progress/heartbeat" },
  complete: { method: "POST", path: "complete" },
  playback: { method: "GET", path: "playback" },
} as const;
type Action = keyof typeof actions;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sameOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  return origin === new URL(env.WEB_APP_URL).origin || request.headers.get("sec-fetch-site") === "same-origin";
};

async function forward(request: NextRequest, ctx: RouteContext<"/api/learn/lessons/[id]/[action]">, method: "GET" | "POST") {
  const { id, action } = await ctx.params;
  if (!UUID.test(id) || !(action in actions) || actions[action as Action].method !== method) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  // CSRF: state-changing calls must come from our own pages (spec §18.3).
  if (method === "POST" && !sameOrigin(request)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden." } }, { status: 403 });

  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Your session expired." } }, { status: 401 });

  let body: unknown;
  if (method === "POST") {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Too large." } }, { status: 413 });
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Invalid JSON." } }, { status: 400 });
    }
  }
  const res = await apiRequest(`/lessons/${id}/${actions[action as Action].path}`, { method, accessToken, ...(method === "POST" && action !== "complete" ? { body } : {}) });
  const payload = res.ok ? { data: res.data } : { error: res.error };
  return NextResponse.json(payload, { status: res.status, headers: { "cache-control": "private, no-store" } });
}

export const GET = (request: NextRequest, ctx: RouteContext<"/api/learn/lessons/[id]/[action]">) => forward(request, ctx, "GET");
export const POST = (request: NextRequest, ctx: RouteContext<"/api/learn/lessons/[id]/[action]">) => forward(request, ctx, "POST");
