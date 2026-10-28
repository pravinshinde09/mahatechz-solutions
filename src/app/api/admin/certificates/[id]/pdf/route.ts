import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/admin/certificates/:id/pdf — staff download; the API applies `certificate.read` scope. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/certificates/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return NextResponse.redirect(new URL("/api/auth/refresh?next=/admin/certificates", env.WEB_APP_URL), 303);
  const res = await apiRequest<{ url: string }>(`/admin/certificates/${id}/pdf?format=json`, { accessToken });
  if (!res.ok) return new NextResponse(res.error.message, { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  return NextResponse.redirect(res.data.url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
