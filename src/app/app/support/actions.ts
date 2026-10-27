"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import type { MediaAsset, MediaPurpose, UploadInstruction } from "@/lib/contracts/media";
import { fromApi, text, type FormState } from "@/lib/forms";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const attachmentIds = (form: FormData) => form.getAll("attachmentId").filter((v): v is string => typeof v === "string" && UUID.test(v)).slice(0, 5);

export async function startAttachmentUploadAction(input: { purpose: MediaPurpose; filename: string; mimeType: string; sizeBytes: number }) {
  const res = await authedRequest<{ mediaAssetId: string; upload: UploadInstruction }>("/support/attachments", {
    method: "POST",
    body: { filename: input.filename, mimeType: input.mimeType, sizeBytes: input.sizeBytes },
  });
  return res.ok ? ({ ok: true, ...res.data } as const) : ({ ok: false, message: res.error.message } as const);
}

export async function completeAttachmentUploadAction(mediaAssetId: string) {
  const res = await authedRequest<MediaAsset>(`/support/attachments/${mediaAssetId}/complete`, { method: "POST" });
  return res.ok ? ({ ok: true, asset: res.data } as const) : ({ ok: false, message: res.error.message } as const);
}

export async function createTicketAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { category: text(form, "category"), subject: text(form, "subject"), message: text(form, "message"), relatedCourseId: text(form, "relatedCourseId") };
  const res = await authedRequest<{ id: string }>("/support/tickets", {
    method: "POST",
    body: { category: values.category, subject: values.subject.trim(), message: values.message.trim(), relatedCourseId: values.relatedCourseId || null, attachmentIds: attachmentIds(form) },
  });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/app/support");
  redirect(`/app/support/${res.data.id}?created=1`);
}

export async function replyTicketAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const body = text(form, "body").trim();
  if (!body) return { status: "error", message: "Write a message first.", fieldErrors: { body: "Write a message first." } };
  const res = await authedRequest(`/support/tickets/${id}/messages`, { method: "POST", body: { body, attachmentIds: attachmentIds(form) } });
  if (!res.ok) return fromApi(res.error, { body });
  revalidatePath(`/app/support/${id}`);
  // `sent` changes on every success so the form remounts empty.
  return { status: "success", message: "Message sent.", values: { sent: String(Date.now()) } };
}

export async function resolveTicketAction(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  await authedRequest(`/support/tickets/${id}/resolve`, { method: "POST" });
  revalidatePath(`/app/support/${id}`);
  revalidatePath("/app/support");
}

/** Opens an attachment through a short-lived signed URL (owner, or support staff). */
export async function attachmentUrlAction(ticketId: string, assetId: string): Promise<string | null> {
  if (!UUID.test(ticketId) || !UUID.test(assetId)) return null;
  const res = await authedRequest<{ url: string }>(`/support/tickets/${ticketId}/attachments/${assetId}`);
  return res.ok ? res.data.url : null;
}
