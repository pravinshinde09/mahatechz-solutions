"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import { fromApi, text, type FormState } from "@/lib/forms";
import { fromIstInput } from "@/lib/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const optional = (v: string) => (v.trim() ? v.trim() : null);

// ───────────── live classes (spec §12) ─────────────

function sessionBody(form: FormData) {
  const startsAt = fromIstInput(text(form, "startsAt"));
  const minutes = Number(text(form, "durationMinutes"));
  const reminders = form.getAll("reminder").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return {
    values: Object.fromEntries(["courseId", "moduleId", "title", "description", "startsAt", "durationMinutes", "meetingProvider", "meetingUrl"].map((k) => [k, text(form, k)])),
    body: {
      title: text(form, "title").trim(),
      description: optional(text(form, "description")),
      moduleId: optional(text(form, "moduleId")),
      meetingProvider: text(form, "meetingProvider"),
      meetingUrl: text(form, "meetingUrl").trim(),
      reminderOffsets: reminders,
      ...(startsAt ? { startsAt, endsAt: new Date(Date.parse(startsAt) + (Number.isFinite(minutes) && minutes > 0 ? minutes : 60) * 60_000).toISOString() } : {}),
    },
    startsAt,
  };
}

export async function createLiveSessionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { body, values, startsAt } = sessionBody(form);
  if (!startsAt) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { startsAt: "Choose when the class starts." }, values };
  const res = await authedRequest<{ id: string }>("/admin/live-sessions", { method: "POST", body: { ...body, courseId: text(form, "courseId") } });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/live");
  redirect(`/admin/live/${res.data.id}?created=1`);
}

export async function updateLiveSessionAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { body, values } = sessionBody(form);
  const res = await authedRequest(`/admin/live-sessions/${id}`, { method: "PATCH", body });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/live", "layout");
  return { status: "success", message: "Saved. Students see the change straight away; reminders follow the new time." };
}

/** After the class: recording (hosted video or link), notes, and marking it finished. */
export async function saveLiveFollowUpAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const recordingExternalUrl = optional(text(form, "recordingExternalUrl"));
  const recordingAssetId = text(form, "recordingAssetId");
  const res = await authedRequest(`/admin/live-sessions/${id}`, {
    method: "PATCH",
    body: {
      notes: optional(text(form, "notes")),
      ...(recordingAssetId && UUID.test(recordingAssetId) ? { recordingAssetId } : recordingExternalUrl !== null || form.get("clearRecording") === "on" ? { recordingExternalUrl, ...(recordingExternalUrl ? {} : { recordingAssetId: null }) } : {}),
      ...(form.get("markCompleted") === "on" ? { status: "COMPLETED" } : {}),
    },
  });
  if (!res.ok) return fromApi(res.error, { notes: text(form, "notes"), recordingExternalUrl: text(form, "recordingExternalUrl") });
  revalidatePath("/admin/live", "layout");
  return { status: "success", message: "Saved — enrolled students can see it now." };
}

export async function cancelLiveSessionAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const res = await authedRequest(`/admin/live-sessions/${id}/cancel`, { method: "POST", body: { reason: text(form, "reason").trim() } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/live", "layout");
  return { status: "success", message: "Cancelled. Enrolled students were notified by email." };
}

export async function deleteLiveSessionAction(id: string): Promise<FormState> {
  const res = await authedRequest(`/admin/live-sessions/${id}`, { method: "DELETE" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/live");
  redirect("/admin/live");
}

// ───────────── announcements (spec FR-COM-01) ─────────────

export async function createAnnouncementAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { scope: text(form, "scope"), courseId: text(form, "courseId"), title: text(form, "title"), body: text(form, "body") };
  const scope = values.scope === "PLATFORM" ? "PLATFORM" : "COURSE";
  const expiresAt = fromIstInput(text(form, "expiresAt"));
  const res = await authedRequest("/admin/announcements", {
    method: "POST",
    body: {
      scope,
      courseId: scope === "COURSE" ? values.courseId || null : null,
      title: values.title.trim(),
      body: values.body.trim(),
      publish: form.get("publish") === "on",
      sendEmail: form.get("sendEmail") === "on",
      expiresAt,
    },
  });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/announcements");
  return { status: "success", message: form.get("publish") === "on" ? "Published. Students are being notified." : "Saved as a draft.", values: { sent: String(Date.now()) } };
}

export async function publishAnnouncementAction(id: string, publish: boolean): Promise<FormState> {
  const res = await authedRequest(`/admin/announcements/${id}`, { method: "PATCH", body: { publish } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/announcements");
  return { status: "success", message: publish ? "Published." : "Unpublished." };
}

export async function deleteAnnouncementAction(id: string): Promise<FormState> {
  const res = await authedRequest(`/admin/announcements/${id}`, { method: "DELETE" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/announcements");
  return { status: "success", message: "Deleted." };
}

// ───────────── support (spec FR-COM-03) ─────────────

export async function staffReplyAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const body = text(form, "body").trim();
  if (!body) return { status: "error", message: "Write a message first.", fieldErrors: { body: "Write a message first." } };
  const isInternalNote = form.get("isInternalNote") === "on";
  const res = await authedRequest(`/admin/support/tickets/${id}/messages`, { method: "POST", body: { body, isInternalNote, attachmentIds: [] } });
  if (!res.ok) return fromApi(res.error, { body });
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/admin/support");
  return { status: "success", message: isInternalNote ? "Note added (staff only)." : "Reply sent — the student was emailed.", values: { sent: String(Date.now()) } };
}

export async function updateTicketAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const assignee = text(form, "assigneeId");
  const res = await authedRequest(`/admin/support/tickets/${id}`, {
    method: "PATCH",
    body: { status: text(form, "status"), priority: text(form, "priority"), assigneeId: assignee && UUID.test(assignee) ? assignee : null },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/admin/support");
  return { status: "success", message: "Ticket updated." };
}
