import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";
const secureCookies = process.env.COOKIE_SECURE === "true";
const ACCESS_COOKIE = secureCookies ? "__Host-mz_at" : "mz_at";

// Browser-facing API origin: serves media from the local driver in development.
const apiOrigin = new URL(process.env.API_PUBLIC_URL ?? "http://localhost:4000").origin;

// Razorpay Checkout opens in an iframe and reports telemetry (spec §13.3).
const RAZORPAY_FRAMES = ["https://api.razorpay.com", "https://checkout.razorpay.com"];
const RAZORPAY_CONNECT = ["https://api.razorpay.com", "https://lumberjack.razorpay.com"];

// Embeds allowed for lesson players (spec §11.5) — the same hosts the API allowlists.
const FRAME_HOSTS = ["https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://drive.google.com", "https://player.mediadelivery.net", ...RAZORPAY_FRAMES];
// Direct-to-provider uploads (spec §11.3): Cloudinary, Bunny TUS, R2 presigned PUTs.
const UPLOAD_HOSTS = ["https://api.cloudinary.com", "https://video.bunnycdn.com", "https://*.r2.cloudflarestorage.com"];

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Radix positions popovers with style attributes; attribute styles cannot run script.
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' data: blob: https://res.cloudinary.com https://*.razorpay.com ${apiOrigin}`,
    `media-src 'self' blob: ${apiOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin} ${UPLOAD_HOSTS.join(" ")} ${RAZORPAY_CONNECT.join(" ")}`,
    `frame-src ${FRAME_HOSTS.join(" ")}`,
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

  const protectedArea = ["/app", "/admin", "/checkout"].some((area) => pathname === area || pathname.startsWith(`${area}/`));
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
