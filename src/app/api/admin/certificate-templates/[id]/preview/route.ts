import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { cookieNames } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/admin/certificate-templates/:id/preview — sample-data PDF of a saved template, shown inline. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/certificate-templates/[id]/preview">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return NextResponse.redirect(new URL("/api/auth/refresh?next=/admin/certificates/templates", env.WEB_APP_URL), 303);
  let res: Response;
  try {
    res = await fetch(`${env.API_INTERNAL_URL}/api/v1/admin/certificate-templates/${id}/preview`, { cache: "no-store", headers: { authorization: `Bearer ${accessToken}` } });
  } catch {
    return new NextResponse("We couldn't reach the server. Please try again.", { status: 503 });
  }
  if (!res.ok || res.headers.get("content-type") !== "application/pdf") return new NextResponse("The preview couldn't be generated.", { status: res.status === 200 ? 502 : res.status });
  return new NextResponse(await res.arrayBuffer(), {
    status: 200,
    headers: { "content-type": "application/pdf", "content-disposition": 'inline; filename="certificate-preview.pdf"', "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
  });
}
