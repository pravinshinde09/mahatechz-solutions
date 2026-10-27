"use server";

import { revalidatePath } from "next/cache";
import { authedRequest } from "@/lib/api/server";
import { fromApi, text, type FormState } from "@/lib/forms";
import { fromIstInput, rupeesToPaise } from "@/lib/format";

const bad = (field: string, message: string): FormState => ({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: { [field]: message } });

// ───────────── offline verification (spec §13.4) ─────────────

export async function approveOfflineAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const amount = rupeesToPaise(text(form, "verifiedAmount"));
  if (amount === null || Number.isNaN(amount) || amount <= 0) return bad("verifiedAmount", "Enter the amount you found in the statement.");
  const note = text(form, "note").trim();
  const res = await authedRequest(`/admin/offline-payments/${id}/approve`, {
    method: "POST",
    body: { verifiedAmountPaise: amount, acceptAmountMismatch: form.get("acceptAmountMismatch") === "on", ...(note ? { note } : {}) },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/offline-payments", "layout");
  revalidatePath("/admin");
  return { status: "success", message: "Approved — the student now has access." };
}

export async function rejectOfflineAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const res = await authedRequest(`/admin/offline-payments/${id}/reject`, { method: "POST", body: { reason: text(form, "reason") } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/offline-payments", "layout");
  revalidatePath("/admin");
  return { status: "success", message: "Rejected — the student has been emailed the reason." };
}

export async function proofUrlAction(id: string): Promise<string | null> {
  const res = await authedRequest<{ url: string }>(`/admin/offline-payments/${id}/proof`);
  return res.ok ? res.data.url : null;
}

// ───────────── payments & refunds (spec §13.6) ─────────────

export async function refundAction(paymentId: string, offline: boolean, _prev: FormState, form: FormData): Promise<FormState> {
  const amountText = text(form, "amount").trim();
  const amount = amountText ? rupeesToPaise(amountText) : null;
  if (Number.isNaN(amount)) return bad("amount", "Enter the refund amount in rupees, or leave empty for a full refund.");
  const reference = text(form, "manualReference").trim();
  if (offline && !reference) return bad("manualReference", "Enter the reference of your refund transfer.");
  const res = await authedRequest(`/admin/payments/${paymentId}/refunds`, {
    method: "POST",
    body: { reason: text(form, "reason"), revokeAccess: form.get("revokeAccess") === "on", ...(amount ? { amountPaise: amount } : {}), ...(reference ? { manualReference: reference } : {}) },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/payments/${paymentId}`);
  revalidatePath("/admin/payments");
  return { status: "success", message: offline ? "Refund recorded." : "Refund requested from Razorpay. It completes when Razorpay confirms it." };
}

export async function reconcileAction(_prev: FormState): Promise<FormState> {
  const res = await authedRequest<{ checked: number; activated: number; expired: number }>("/admin/payments/reconcile", { method: "POST" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/payments");
  return { status: "success", message: `Checked ${res.data.checked} open orders: ${res.data.activated} activated, ${res.data.expired} expired.` };
}

// ───────────── enrollments (spec §13.5) ─────────────

export async function grantEnrollmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  const expires = text(form, "expiresAt");
  const values = { email: text(form, "email"), courseId: text(form, "courseId"), reason: text(form, "reason") };
  const res = await authedRequest("/admin/enrollments", {
    method: "POST",
    body: { ...values, ...(expires ? { expiresAt: fromIstInput(`${expires}T23:59`) } : {}) },
  });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/enrollments");
  return { status: "success", message: `Access granted to ${values.email}.` };
}

export async function updateEnrollmentAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const action = text(form, "action");
  const expires = text(form, "expiresAt");
  const lifetime = form.get("lifetime") === "on";
  const res = await authedRequest(`/admin/enrollments/${id}`, {
    method: "PATCH",
    body: {
      action,
      reason: text(form, "reason"),
      ...(action === "extend" ? { expiresAt: lifetime ? null : expires ? fromIstInput(`${expires}T23:59`) : undefined } : {}),
    },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/enrollments");
  return { status: "success", message: "Enrolment updated." };
}

// ───────────── settings ─────────────

export async function saveOfflineSettingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const fields = ["payeeName", "upiId", "bankName", "bankAccountName", "bankAccountNumber", "ifsc", "notes"] as const;
  const body = Object.fromEntries(fields.map((f) => [f, f === "ifsc" ? text(form, f).trim().toUpperCase() : text(form, f).trim()]));
  const res = await authedRequest("/admin/settings/offline-payments", { method: "PUT", body });
  if (!res.ok) return fromApi(res.error, body);
  revalidatePath("/admin/settings");
  return { status: "success", message: "Payment details saved. The change is recorded in the audit log." };
}
