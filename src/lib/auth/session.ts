import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiRequest } from "@/lib/api/server";
import type { MeResponse } from "@/lib/contracts/me";
import { cookieNames } from "./cookies";

export type CurrentUser = MeResponse;

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(cookieNames.access)?.value ?? null;
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<{ user: CurrentUser | null; reason?: "suspended" | "expired" }> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return { user: null, reason: "expired" };
  const res = await apiRequest<MeResponse>("/me", { accessToken });
  if (res.ok) return { user: res.data };
  return { user: null, reason: res.error.code === "ACCOUNT_SUSPENDED" ? "suspended" : "expired" };
});

async function currentPath() {
  return (await headers()).get("x-pathname") ?? "/app";
}

/**
 * Server Components can't set cookies, so an expired access token is renewed by redirecting through
 * the /api/auth/refresh route handler, which rotates the refresh token and comes straight back.
 */
export async function requireUser(): Promise<CurrentUser> {
  const { user, reason } = await getCurrentUser();
  if (user) return user;
  if (reason === "suspended") redirect("/api/auth/signout?reason=suspended");
  redirect(`/api/auth/refresh?next=${encodeURIComponent(await currentPath())}`);
}

/** Staff area guard. Staff without 2FA may only reach the security page (API enforces the same). */
export async function requireStaff(options: { allowWithout2fa?: boolean } = {}): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isStaff) redirect("/app");
  if (!user.twoFactorEnabled && !options.allowWithout2fa) redirect("/admin/security");
  return user;
}

export const hasPermission = (user: CurrentUser, permission: string) => user.permissions.includes(permission);
