import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/live/:id/ics — calendar file for an enrolled student (spec §12.2 item 4). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/live/[id]/ics">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return NextResponse.redirect(new URL("/api/auth/refresh?next=/app/live", env.WEB_APP_URL), 303);
  try {
    const res = await fetch(`${env.API_INTERNAL_URL}/api/v1/live-sessions/${id}/ics`, { cache: "no-store", headers: { authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return new NextResponse("This class isn't available.", { status: res.status });
    return new NextResponse(await res.text(), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": res.headers.get("content-disposition") ?? 'attachment; filename="live-class.ics"',
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("We couldn't reach the server.", { status: 503 });
  }
}
