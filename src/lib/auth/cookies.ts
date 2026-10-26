import "server-only";
import { cookies } from "next/headers";
import type { TokenPair } from "@/lib/contracts/auth";
import { env } from "@/lib/env";

// Spec §18.1: HttpOnly, Secure, SameSite=Lax. The refresh cookie is only ever sent to /api/auth.
// With Secure cookies the __Host-/__Secure- prefixes make the browser enforce those attributes.
const secure = env.COOKIE_SECURE;
export const REFRESH_PATH = "/api/auth";
export const cookieNames = {
  access: secure ? "__Host-mz_at" : "mz_at",
  refresh: secure ? "__Secure-mz_rt" : "mz_rt",
  challenge: secure ? "__Host-mz_2fa" : "mz_2fa",
} as const;

const base = { httpOnly: true, secure, sameSite: "lax" as const };
const secondsUntil = (iso: string) => Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Access cookie expires slightly before the JWT, so an expired token is simply absent. */
export function writeSessionCookies(store: CookieStore, tokens: TokenPair) {
  store.set(cookieNames.access, tokens.accessToken, { ...base, path: "/", maxAge: Math.max(0, secondsUntil(tokens.accessTokenExpiresAt) - 15) });
  store.set(cookieNames.refresh, tokens.refreshToken, { ...base, path: REFRESH_PATH, maxAge: secondsUntil(tokens.refreshTokenExpiresAt) });
}

export function clearSessionCookies(store: CookieStore) {
  store.set(cookieNames.access, "", { ...base, path: "/", maxAge: 0 });
  store.set(cookieNames.refresh, "", { ...base, path: REFRESH_PATH, maxAge: 0 });
}

/** Holds a pending 2FA challenge id between the password and code steps (5 minutes). */
export function writeChallengeCookie(store: CookieStore, challengeId: string, expiresAt: string) {
  store.set(cookieNames.challenge, challengeId, { ...base, path: "/", maxAge: secondsUntil(expiresAt) });
}

export function clearChallengeCookie(store: CookieStore) {
  store.set(cookieNames.challenge, "", { ...base, path: "/", maxAge: 0 });
}
