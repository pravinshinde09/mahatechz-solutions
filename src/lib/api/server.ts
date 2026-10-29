import "server-only";
import { cookies, headers as requestHeaders } from "next/headers";
import { cookieNames } from "@/lib/auth/cookies";
import type { ErrorCode } from "@/lib/contracts/errors";
import { env } from "@/lib/env";

export interface ApiError {
  code: ErrorCode | "NETWORK_ERROR";
  message: string;
  details?: { path: string; issue: string }[];
  requestId?: string;
}

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiError };

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
  headers?: Record<string, string>;
  /** Seconds to keep an anonymous GET in Next's data cache. Ignored when signed in. */
  revalidate?: number;
}

/**
 * Anonymous catalogue reads are shared by every visitor, so they may be cached briefly (the API
 * sends `public, max-age=60`). A cached read can't carry the visitor's IP (it would split the cache
 * per visitor), so only fixed URLs use this — never free-text search, which keeps per-IP limits.
 */
function caching(revalidate: number | undefined, accessToken: string | null | undefined, method: string) {
  return revalidate !== undefined && !accessToken && method === "GET" ? ({ next: { revalidate } } as const) : null;
}

/**
 * The visitor's IP for the API's per-IP limits (spec §18.3), vouched for by the shared secret.
 * Cloudflare sets cf-connecting-ip; other proxies x-real-ip / x-forwarded-for (first hop).
 */
async function forwardedFor(): Promise<Record<string, string>> {
  if (!env.BFF_SHARED_SECRET) return {};
  try {
    const h = await requestHeaders();
    const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return ip ? { "x-client-ip": ip, "x-bff-secret": env.BFF_SHARED_SECRET } : {};
  } catch {
    return {}; // outside a request (build time): nothing to forward
  }
}

/** Server-side call to the API (BFF → API). Never throws for HTTP errors; returns a result. */
export async function apiRequest<T>(path: string, { method = "GET", body, accessToken, headers, revalidate }: Options = {}): Promise<ApiResult<T>> {
  const cached = caching(revalidate, accessToken, method);
  let res: Response;
  try {
    res = await fetch(`${env.API_INTERNAL_URL}/api/v1${path}`, {
      method,
      ...(cached ?? { cache: "no-store" }),
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...(cached ? {} : await forwardedFor()),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    return { ok: false, status: 503, error: { code: "NETWORK_ERROR", message: "We couldn't reach the server. Please try again." } };
  }

  const json = (await res.json().catch(() => null)) as { data?: T; error?: ApiError } | null;
  if (res.ok) return { ok: true, status: res.status, data: json?.data as T };
  return {
    ok: false,
    status: res.status,
    error: json?.error ?? { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  };
}

/** API call as the signed-in user (Server Actions and Server Components only). */
export async function authedRequest<T>(path: string, options: Omit<Options, "accessToken"> = {}): Promise<ApiResult<T>> {
  const accessToken = (await cookies()).get(cookieNames.access)?.value;
  if (!accessToken) return { ok: false, status: 401, error: { code: "UNAUTHENTICATED", message: "Your session expired. Reload the page and try again." } };
  return apiRequest<T>(path, { ...options, accessToken });
}

/** Paginated endpoints return `{ data, page }`; this keeps both. Null on any failure. */
export async function apiPage<T, P = { nextCursor: string | null; hasMore: boolean; total: number }>(
  path: string,
  options: { authed?: boolean; revalidate?: number } = {},
): Promise<{ data: T[]; page: P } | null> {
  const accessToken = options.authed ? (await cookies()).get(cookieNames.access)?.value : undefined;
  const cached = caching(options.revalidate, accessToken, "GET");
  try {
    const res = await fetch(`${env.API_INTERNAL_URL}/api/v1${path}`, {
      ...(cached ?? { cache: "no-store" }),
      headers: { accept: "application/json", ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...(cached ? {} : await forwardedFor()) },
    });
    return res.ok ? ((await res.json()) as { data: T[]; page: P }) : null;
  } catch {
    return null;
  }
}
