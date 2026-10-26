import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";
const secureCookies = process.env.COOKIE_SECURE === "true";
const ACCESS_COOKIE = secureCookies ? "__Host-mz_at" : "mz_at";

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Radix positions popovers with style attributes; attribute styles cannot run script.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Only when served over HTTPS; on plain-http local runs it would rewrite redirects to https://localhost.
    ...(secureCookies ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/**
 * Runs before every page request (spec §24.2 "route protection (UX), security headers, CSP nonce").
 * The redirect below is only an optimistic UX check — real authorization happens in the API.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const protectedArea = pathname === "/app" || pathname.startsWith("/app/") || pathname === "/admin" || pathname.startsWith("/admin/");
  if (protectedArea && !request.cookies.has(ACCESS_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/refresh";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname + search);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
