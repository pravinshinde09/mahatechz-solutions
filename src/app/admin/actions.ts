"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/server";
import { createInvitationRequestSchema, twoFactorEnableRequestSchema } from "@/lib/contracts/auth";
import { getAccessToken } from "@/lib/auth/session";
import { fromApi, fromZod, text, type FormState } from "@/lib/forms";

const expired = { status: "error", message: "Your session expired. Reload the page and try again." } as const;

export type TwoFactorSetupState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; qrDataUrl: string; secret: string };

export async function startTwoFactorSetupAction(): Promise<TwoFactorSetupState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  const res = await apiRequest<{ otpauthUrl: string; secret: string }>("/auth/2fa/setup", { method: "POST", accessToken });
  if (!res.ok) return { status: "error", message: res.error.message };
  const qrDataUrl = await QRCode.toDataURL(res.data.otpauthUrl, { margin: 1, width: 240, errorCorrectionLevel: "M" });
  return { status: "ready", qrDataUrl, secret: res.data.secret };
}

export type EnableTwoFactorState = FormState & { recoveryCodes?: string[] };

export async function enableTwoFactorAction(_prev: EnableTwoFactorState, form: FormData): Promise<EnableTwoFactorState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  const parsed = twoFactorEnableRequestSchema.safeParse({ code: text(form, "code").replace(/\s/g, "") });
  if (!parsed.success) return fromZod(parsed.error);
  const res = await apiRequest<{ recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: parsed.data, accessToken });
  if (!res.ok) return fromApi(res.error);
  // No revalidatePath here: re-rendering the security page would switch it to its "2FA is on"
  // state and unmount the one-time recovery-code screen. "Continue" navigates to a fresh /admin.
  return { status: "success", message: "Two-factor authentication is on.", recoveryCodes: res.data.recoveryCodes };
}

export async function inviteStaffAction(_prev: FormState, form: FormData): Promise<FormState> {
  const accessToken = await getAccessToken();
  if (!accessToken) return expired;
  const values = { email: text(form, "email"), fullName: text(form, "fullName"), role: text(form, "role") };
  const parsed = createInvitationRequestSchema.safeParse({ email: values.email, fullName: values.fullName, role: values.role, courseIds: [] });
  if (!parsed.success) return fromZod(parsed.error, values);
  const res = await apiRequest("/admin/staff/invitations", { method: "POST", body: parsed.data, accessToken });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/staff");
  return { status: "success", message: `Invitation sent to ${parsed.data.email}. It expires in 72 hours.` };
}
