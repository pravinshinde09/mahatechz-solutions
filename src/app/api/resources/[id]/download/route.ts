import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/resources/:id/download — the API checks the enrolment and signs a short-lived URL
 * (spec §11.6); the browser is sent straight to it. Plain links work, including "open in new tab".
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/resources/[id]/download">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  // `next` can't point back at an /api route (open-redirect guard), so the student lands on My courses.
  if (!accessToken) return NextResponse.redirect(new URL("/api/auth/refresh?next=/app/courses", env.WEB_APP_URL), 303);
  const res = await apiRequest<{ url: string }>(`/resources/${id}/download?format=json`, { accessToken });
  if (!res.ok) return new NextResponse(res.status === 404 ? "This file isn't available to you." : res.error.message, { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  return NextResponse.redirect(res.data.url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
