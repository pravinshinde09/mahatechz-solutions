"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api/server";
import {
  acceptInvitationRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  twoFactorVerifyRequestSchema,
  verifyEmailRequestSchema,
  type LoginResponse,
  type TokenPair,
} from "@/lib/contracts/auth";
import type { MeResponse } from "@/lib/contracts/me";
import { clearChallengeCookie, cookieNames, writeChallengeCookie, writeSessionCookies } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/safe-next";
import { fromApi, fromZod, text, type FormState } from "@/lib/forms";

/** "98765 43210" / "098765-43210" → "+919876543210"; anything already starting with + is kept. */
function toE164India(raw: string) {
  const compact = raw.replace(/[\s()-]/g, "");
  if (compact.startsWith("+")) return compact;
  const digits = compact.replace(/^0+/, "");
  return digits.length === 10 ? `+91${digits}` : compact;
}

/** Where to land after sign-in: `next` if given, else the admin or student home. */
async function landingFor(tokens: TokenPair, next: string | null) {
  const me = await apiRequest<MeResponse>("/me", { accessToken: tokens.accessToken });
  const staff = me.ok && me.data.isStaff;
  if (staff && me.ok && !me.data.twoFactorEnabled) return "/admin/security";
  return safeNext(next, staff ? "/admin" : "/app");
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { email: text(form, "email") };
  const parsed = loginRequestSchema.safeParse({ email: text(form, "email"), password: text(form, "password"), client: "web" });
  if (!parsed.success) return fromZod(parsed.error, values);

  const res = await apiRequest<LoginResponse>("/auth/login", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error, values);

  const store = await cookies();
  const next = text(form, "next") || null;
  if (res.data.twoFactorRequired) {
    writeChallengeCookie(store, res.data.challengeId, res.data.expiresAt);
    redirect(`/login/2fa${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}`);
  }
  writeSessionCookies(store, res.data.tokens);
  redirect(await landingFor(res.data.tokens, next));
}

export async function verifyTwoFactorAction(_prev: FormState, form: FormData): Promise<FormState> {
  const store = await cookies();
  const challengeId = store.get(cookieNames.challenge)?.value;
  if (!challengeId) return { status: "error", message: "Your sign-in attempt expired. Please sign in again." };

  const useRecovery = text(form, "mode") === "recovery";
  const parsed = twoFactorVerifyRequestSchema.safeParse(
    useRecovery ? { challengeId, recoveryCode: text(form, "recoveryCode").trim() } : { challengeId, code: text(form, "code").replace(/\s/g, "") },
  );
  if (!parsed.success) return fromZod(parsed.error);

  const res = await apiRequest<{ tokens: TokenPair }>("/auth/2fa/verify", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error);

  clearChallengeCookie(store);
  writeSessionCookies(store, res.data.tokens);
  redirect(await landingFor(res.data.tokens, text(form, "next") || null));
}

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { fullName: text(form, "fullName"), email: text(form, "email"), phone: text(form, "phone"), acceptTerms: text(form, "acceptTerms") };
  const parsed = registerRequestSchema.safeParse({
    fullName: values.fullName,
    email: values.email,
    password: text(form, "password"),
    ...(values.phone.trim() ? { phone: toE164India(values.phone) } : {}),
    acceptTerms: form.get("acceptTerms") === "on",
  });
  if (!parsed.success) return fromZod(parsed.error, values);

  const res = await apiRequest("/auth/register", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error, values);
  redirect(`/register/check-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function verifyEmailAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = verifyEmailRequestSchema.safeParse({ token: text(form, "token") });
  if (!parsed.success) return { status: "error", message: "This verification link is invalid." };
  const res = await apiRequest("/auth/verify-email", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error);
  return { status: "success", message: "Your email is verified. You can now enrol in courses." };
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = forgotPasswordRequestSchema.safeParse({ email: text(form, "email") });
  if (!parsed.success) return fromZod(parsed.error, { email: text(form, "email") });
  const res = await apiRequest("/auth/password/forgot", { method: "POST", body: parsed.data });
  if (!res.ok && res.error.code === "RATE_LIMITED") return fromApi(res.error);
  // Same answer whether or not the account exists.
  return { status: "success", message: "If an account exists for this email, a reset link is on its way. It expires in 1 hour." };
}

/** Used for both password reset and first-time account setup (bootstrapped super admin). */
export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (text(form, "password") !== text(form, "confirmPassword")) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: "Passwords don't match." } };
  }
  const parsed = resetPasswordRequestSchema.safeParse({ token: text(form, "token"), password: text(form, "password") });
  if (!parsed.success) return fromZod(parsed.error);
  const res = await apiRequest("/auth/password/reset", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error);
  redirect("/login?reason=password-set");
}

export async function acceptInvitationAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (text(form, "password") !== text(form, "confirmPassword")) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: "Passwords don't match." } };
  }
  const fullName = text(form, "fullName").trim();
  const parsed = acceptInvitationRequestSchema.safeParse({
    token: text(form, "token"),
    password: text(form, "password"),
    ...(fullName ? { fullName } : {}),
  });
  if (!parsed.success) return fromZod(parsed.error, { fullName });
  const res = await apiRequest("/auth/invitations/accept", { method: "POST", body: parsed.data });
  if (!res.ok) return fromApi(res.error, { fullName });
  redirect("/login?reason=invitation-accepted");
}
