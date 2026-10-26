"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/server";
import { changePasswordRequestSchema } from "@/lib/contracts/auth";
import { updateProfileRequestSchema } from "@/lib/contracts/me";
import { getAccessToken } from "@/lib/auth/session";
import { fromApi, fromZod, text, type FormState } from "@/lib/forms";

const expired: FormState = { status: "error", message: "Your session expired. Reload the page and try again." };

export async function resendVerificationAction(): Promise<FormState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  const res = await apiRequest("/auth/resend-verification", { method: "POST", accessToken });
  if (!res.ok) return fromApi(res.error);
  return { status: "success", message: "A new verification link is on its way." };
}

const optional = (v: string) => (v.trim() === "" ? null : v.trim());

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  // Only fields this form renders are sent; omitted fields are left untouched by the API.
  // College/city/occupation join when /me exposes the student profile (Phase 4 dashboard).
  const parsed = updateProfileRequestSchema.safeParse({
    fullName: text(form, "fullName"),
    phone: optional(text(form, "phone")),
  });
  if (!parsed.success) return fromZod(parsed.error);
  const res = await apiRequest("/me/profile", { method: "PATCH", body: parsed.data, accessToken });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/app", "layout");
  return { status: "success", message: "Profile saved." };
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  if (text(form, "newPassword") !== text(form, "confirmPassword")) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: "Passwords don't match." } };
  }
  const parsed = changePasswordRequestSchema.safeParse({ currentPassword: text(form, "currentPassword"), newPassword: text(form, "newPassword") });
  if (!parsed.success) return fromZod(parsed.error);
  const res = await apiRequest("/auth/password/change", { method: "POST", body: parsed.data, accessToken });
  if (!res.ok) return fromApi(res.error);
  return { status: "success", message: "Password changed. Other devices have been signed out." };
}
