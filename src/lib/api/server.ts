import "server-only";
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
}

/** Server-side call to the API (BFF → API). Never throws for HTTP errors; returns a result. */
export async function apiRequest<T>(path: string, { method = "GET", body, accessToken, headers }: Options = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${env.API_INTERNAL_URL}/api/v1${path}`, {
      method,
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
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
