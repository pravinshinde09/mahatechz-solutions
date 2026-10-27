"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import type { CheckoutOrder, OrderState } from "@/lib/contracts/commerce";
import type { MediaAsset, MediaPurpose, UploadInstruction } from "@/lib/contracts/media";
import { fromApi, text, type FormState } from "@/lib/forms";
import { fromIstInput, rupeesToPaise } from "@/lib/format";

type Fail = { ok: false; message: string; code?: string };

/** Step 1 (spec §13.3): the API prices the course and creates the provider order. */
export async function createOrderAction(courseId: string, idempotencyKey: string): Promise<{ ok: true; order: CheckoutOrder } | Fail> {
  const res = await authedRequest<CheckoutOrder>("/checkout/orders", { method: "POST", body: { courseId }, headers: { "idempotency-key": idempotencyKey } });
  return res.ok ? { ok: true, order: res.data } : { ok: false, message: res.error.message, code: res.error.code };
}

export interface CheckoutResponse {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

/** Local test checkout only (PAYMENT_PROVIDER=simulated): returns what Razorpay's handler would. */
export async function simulatePaymentAction(orderId: string, outcome: "captured" | "failed"): Promise<{ ok: true; response: CheckoutResponse } | Fail> {
  const res = await authedRequest<CheckoutResponse>(`/checkout/orders/${orderId}/simulate`, { method: "POST", body: { outcome } });
  return res.ok ? { ok: true, response: res.data } : { ok: false, message: res.error.message };
}

/** Step 3: never trusted on its own — the API checks the signature and fetches the payment. */
export async function verifyPaymentAction(orderId: string, response: CheckoutResponse): Promise<{ ok: true; state: OrderState } | Fail> {
  const res = await authedRequest<OrderState>(`/checkout/orders/${orderId}/verify`, { method: "POST", body: response });
  if (res.ok) revalidatePath("/app", "layout");
  return res.ok ? { ok: true, state: res.data } : { ok: false, message: res.error.message, code: res.error.code };
}

export async function orderStateAction(orderId: string): Promise<OrderState | null> {
  const res = await authedRequest<OrderState>(`/checkout/orders/${orderId}`);
  return res.ok ? res.data : null;
}

export async function freeEnrollAction(courseId: string, _prev: FormState): Promise<FormState> {
  const res = await authedRequest("/checkout/free-enroll", { method: "POST", body: { courseId } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/app", "layout");
  redirect("/app/courses?enrolled=1");
}

// ───────────── offline payments (spec §13.4) ─────────────

export async function startProofUploadAction(input: { purpose: MediaPurpose; filename: string; mimeType: string; sizeBytes: number }) {
  const res = await authedRequest<{ mediaAssetId: string; upload: UploadInstruction }>("/offline-payments/proof-upload-url", {
    method: "POST",
    body: { filename: input.filename, mimeType: input.mimeType, sizeBytes: input.sizeBytes },
  });
  return res.ok ? ({ ok: true, ...res.data } as const) : ({ ok: false, message: res.error.message } as const);
}

export async function completeProofUploadAction(mediaAssetId: string) {
  const res = await authedRequest<MediaAsset>(`/offline-payments/proofs/${mediaAssetId}/complete`, { method: "POST" });
  return res.ok ? ({ ok: true, asset: res.data } as const) : ({ ok: false, message: res.error.message } as const);
}

export async function submitOfflinePaymentAction(courseId: string, idempotencyKey: string, _prev: FormState, form: FormData): Promise<FormState> {
  const amount = rupeesToPaise(text(form, "amount"));
  if (amount === null || Number.isNaN(amount) || amount <= 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { amount: "Enter the amount you paid in rupees." } };
  }
  const paidAt = fromIstInput(text(form, "paidAt"));
  if (!paidAt) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { paidAt: "Enter when you paid." } };
  const proofAssetId = text(form, "proofAssetId");
  const res = await authedRequest("/offline-payments", {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: {
      courseId,
      method: text(form, "method"),
      referenceNumber: text(form, "referenceNumber"),
      paidAt,
      claimedAmountPaise: amount,
      ...(proofAssetId ? { proofAssetId } : {}),
    },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/app", "layout");
  redirect("/app/payments?submitted=1");
}

export async function cancelOfflinePaymentAction(id: string): Promise<FormState> {
  const res = await authedRequest(`/offline-payments/${id}/cancel`, { method: "POST" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/app/payments");
  return { status: "success", message: "Submission cancelled." };
}
