import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

// Quiz attempts from the browser (spec §15.7). Same model as the lesson events route: the access
// token stays in its HttpOnly cookie and only these four calls exist — no generic proxy.
const actions = {
  start: { method: "POST", api: "POST", path: (id: string) => `/quizzes/${id}/attempts` },
  view: { method: "GET", api: "GET", path: (id: string) => `/quiz-attempts/${id}` },
  answers: { method: "PUT", api: "PUT", path: (id: string) => `/quiz-attempts/${id}/answers` },
  submit: { method: "POST", api: "POST", path: (id: string) => `/quiz-attempts/${id}/submit` },
} as const;
type Action = keyof typeof actions;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Answers for up to 200 questions. */
const MAX_BODY = 64 * 1024;

const sameOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  return origin === new URL(env.WEB_APP_URL).origin || request.headers.get("sec-fetch-site") === "same-origin";
};

async function forward(request: NextRequest, ctx: RouteContext<"/api/learn/quiz/[id]/[action]">, method: "GET" | "POST" | "PUT") {
  const { id, action } = await ctx.params;
  if (!UUID.test(id) || !(action in actions) || actions[action as Action].method !== method) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  // CSRF: state-changing calls must come from our own pages (spec §18.3).
  if (method !== "GET" && !sameOrigin(request)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden." } }, { status: 403 });

  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Your session expired." } }, { status: 401 });

  let body: unknown;
  if (method !== "GET" && action !== "start") {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Too large." } }, { status: 413 });
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: { code: "VALIDATION_FAILED", message: "Invalid JSON." } }, { status: 400 });
    }
  }
  const spec = actions[action as Action];
  const res = await apiRequest(spec.path(id), { method: spec.api, accessToken, ...(body !== undefined ? { body } : {}) });
  const payload = res.ok ? { data: res.data } : { error: res.error };
  return NextResponse.json(payload, { status: res.status, headers: { "cache-control": "private, no-store" } });
}

export const GET = (request: NextRequest, ctx: RouteContext<"/api/learn/quiz/[id]/[action]">) => forward(request, ctx, "GET");
export const POST = (request: NextRequest, ctx: RouteContext<"/api/learn/quiz/[id]/[action]">) => forward(request, ctx, "POST");
export const PUT = (request: NextRequest, ctx: RouteContext<"/api/learn/quiz/[id]/[action]">) => forward(request, ctx, "PUT");
