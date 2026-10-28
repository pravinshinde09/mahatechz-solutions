"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import type { AdminQuiz, QuestionInput } from "@/lib/contracts/assessment";
import { templateLayoutSchema, type CertificateTemplateView } from "@/lib/contracts/certification";
import { fromApi, text, type FormState } from "@/lib/forms";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const optional = (v: string) => (v.trim() ? v.trim() : null);
const invalid = (field: string, message: string): FormState => ({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: { [field]: message } });

// ───────────── completion overrides (spec §15.4) ─────────────

export async function overrideCompletionAction(enrollmentId: string, studentId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const action = text(form, "action");
  const lessonId = text(form, "lessonId");
  const res = await authedRequest(`/admin/enrollments/${enrollmentId}/completion-override`, {
    method: "POST",
    body: { action, reason: text(form, "reason").trim(), ...(action === "MARK_LESSON_COMPLETE" && UUID.test(lessonId) ? { lessonId } : {}) },
  });
  if (!res.ok) return fromApi(res.error, { reason: text(form, "reason") });
  revalidatePath(`/admin/students/${studentId}`);
  return { status: "success", message: action === "MARK_INCOMPLETE" ? "Marked incomplete. It stays incomplete until an admin marks it complete." : "Saved and audit-logged." };
}

// ───────────── certificates (spec §16) ─────────────

export async function issueCertificateAction(enrollmentId: string, studentId: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const override = form.get("override") === "on";
  const res = await authedRequest<{ certificateNumber: string }>("/admin/certificates", {
    method: "POST",
    body: { enrollmentId, override, ...(override ? { reason: text(form, "reason").trim() } : {}) },
  });
  if (!res.ok) return fromApi(res.error, { reason: text(form, "reason") });
  revalidatePath("/admin/certificates", "layout");
  if (studentId) revalidatePath(`/admin/students/${studentId}`);
  return { status: "success", message: `Issued ${res.data.certificateNumber}. The PDF is being prepared and the student will be emailed.` };
}

export async function bulkIssueAction(_prev: FormState, form: FormData): Promise<FormState> {
  const ids = form.getAll("enrollmentId").map(String).filter((id) => UUID.test(id));
  if (!ids.length) return { status: "error", message: "Select at least one student." };
  const res = await authedRequest<{ issued: { certificateNumber: string }[]; failed: { message: string }[] }>("/admin/certificates/bulk", { method: "POST", body: { enrollmentIds: ids } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/certificates", "layout");
  const { issued, failed } = res.data;
  if (!issued.length) return { status: "error", message: `No certificates were issued: ${[...new Set(failed.map((f) => f.message))].join(" ")}` };
  // The issued rows leave the list (and may empty it), so the outcome travels in the URL.
  redirect(`/admin/certificates/eligible?issued=${issued.length}${failed.length ? `&failed=${failed.length}` : ""}`);
}

export async function revokeCertificateAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const res = await authedRequest(`/admin/certificates/${id}/revoke`, { method: "POST", body: { reason: text(form, "reason").trim() } });
  if (!res.ok) return fromApi(res.error, { reason: text(form, "reason") });
  revalidatePath("/admin/certificates", "layout");
  return { status: "success", message: "Revoked. The verification page now shows it as revoked (without your reason)." };
}

export async function reissueCertificateAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const name = optional(text(form, "recipientName"));
  const res = await authedRequest<{ id: string }>(`/admin/certificates/${id}/reissue`, { method: "POST", body: { reason: text(form, "reason").trim(), ...(name ? { recipientName: name } : {}) } });
  if (!res.ok) return fromApi(res.error, { reason: text(form, "reason"), recipientName: text(form, "recipientName") });
  revalidatePath("/admin/certificates", "layout");
  redirect(`/admin/certificates/${res.data.id}?reissued=1`);
}

// ───────────── certificate templates ─────────────

function templateBody(form: FormData) {
  let layout: unknown;
  try {
    layout = JSON.parse(text(form, "layout"));
  } catch {
    layout = null;
  }
  const values = Object.fromEntries(["name", "organizationName", "heading", "bodyText", "signatoryName", "signatoryTitle", "accentColor"].map((k) => [k, text(form, k)]));
  const asset = (k: string) => (UUID.test(text(form, k)) ? text(form, k) : null);
  return {
    values,
    layoutOk: templateLayoutSchema.safeParse(layout).success,
    body: {
      name: text(form, "name").trim(),
      organizationName: text(form, "organizationName").trim(),
      heading: text(form, "heading").trim(),
      bodyText: text(form, "bodyText").trim(),
      signatoryName: optional(text(form, "signatoryName")),
      signatoryTitle: optional(text(form, "signatoryTitle")),
      signatureAssetId: asset("signatureAssetId"),
      backgroundAssetId: asset("backgroundAssetId"),
      accentColor: text(form, "accentColor"),
      layout,
    },
  };
}

export async function saveTemplateAction(id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { body, values, layoutOk } = templateBody(form);
  if (!layoutOk) return { ...invalid("layout", "A field position is out of the page. Reset the layout and try again."), values };
  const res = await authedRequest<CertificateTemplateView>(id ? `/admin/certificate-templates/${id}` : "/admin/certificate-templates", { method: id ? "PUT" : "POST", body });
  if (!res.ok) return fromApi(res.error, values);
  revalidatePath("/admin/certificates", "layout");
  if (!id) redirect(`/admin/certificates/templates/${res.data.id}?created=1`);
  return { status: "success", message: "Saved. New certificates use this design; issued certificates keep the text they were issued with." };
}

export async function archiveTemplateAction(id: string): Promise<FormState> {
  const res = await authedRequest(`/admin/certificate-templates/${id}/archive`, { method: "POST" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/certificates", "layout");
  redirect("/admin/certificates/templates");
}

// ───────────── course certificate & completion settings ─────────────

export async function saveCompletionSettingsAction(courseId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const days = text(form, "recommendedDurationDays").trim();
  const minimum = Number(text(form, "minimumLessonCompletionPercent"));
  const average = text(form, "minimumAverageQuizScorePercent").trim();
  const requireAll = form.get("requireAllRequiredLessons") === "on";
  if (days && !(Number.isInteger(Number(days)) && Number(days) >= 1)) return invalid("recommendedDurationDays", "Enter a whole number of days, or leave it empty.");
  if (!requireAll && !(Number.isInteger(minimum) && minimum >= 1 && minimum <= 100)) return invalid("minimumLessonCompletionPercent", "Enter a percentage from 1 to 100.");
  if (average && !(Number.isInteger(Number(average)) && Number(average) >= 0 && Number(average) <= 100)) return invalid("minimumAverageQuizScorePercent", "Enter a percentage from 0 to 100, or leave it empty.");
  const template = text(form, "certificateTemplateId");
  const res = await authedRequest(`/admin/courses/${courseId}`, {
    method: "PATCH",
    body: {
      certificateEnabled: form.get("certificateEnabled") === "on",
      certificateTemplateId: UUID.test(template) ? template : null,
      autoIssueCertificate: form.get("autoIssueCertificate") === "on",
      certificateCode: optional(text(form, "certificateCode")),
      recommendedDurationDays: days ? Number(days) : null,
      completionRule: {
        version: 1,
        requireAllRequiredLessons: requireAll,
        minimumLessonCompletionPercent: requireAll ? 100 : minimum,
        requiredQuizIds: form.getAll("requiredQuizIds").map(String).filter((id) => UUID.test(id)),
        minimumAverageQuizScorePercent: average ? Number(average) : null,
        requiredAssignmentIds: [],
        minimumAttendancePercent: null,
        excludeSelfReportedLessons: form.get("excludeSelfReportedLessons") === "on",
      },
    },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/courses/${courseId}`, "layout");
  return { status: "success", message: "Saved. Changes apply to students' next progress update." };
}

// ───────────── quiz builder (spec §15.7) ─────────────

export async function saveQuizSettingsAction(courseId: string, quizId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const num = (k: string) => Number(text(form, k));
  const minutes = text(form, "timeLimitMinutes").trim();
  const attempts = text(form, "maxAttempts").trim();
  const res = await authedRequest<AdminQuiz>(`/admin/quizzes/${quizId}`, {
    method: "PUT",
    body: {
      passPercent: num("passPercent"),
      maxAttempts: attempts ? Number(attempts) : null,
      timeLimitSeconds: minutes ? Math.round(Number(minutes) * 60) : null,
      shuffleQuestions: form.get("shuffleQuestions") === "on",
      showAnswersAfter: text(form, "showAnswersAfter"),
    },
  });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/courses/${courseId}/quizzes/${quizId}`);
  return { status: "success", message: "Quiz settings saved." };
}

/** One question (create or replace); options arrive as label/correct pairs from the builder. */
export async function saveQuestionAction(courseId: string, quizId: string, questionId: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const type = text(form, "type") as QuestionInput["type"];
  const labels = form.getAll("optionLabel").map(String);
  const correct = new Set(form.getAll("optionCorrect").map(String));
  const options = labels.map((label, i) => ({ label: label.trim(), isCorrect: correct.has(String(i)) })).filter((o) => o.label);
  const numeric = (k: string) => {
    const v = text(form, k).trim().replace(",", ".");
    return v === "" ? null : Number(v);
  };
  const answer = numeric("numericAnswer");
  if (type === "NUMERIC" && (answer === null || Number.isNaN(answer))) return invalid("numericAnswer", "Enter the correct numeric answer.");
  const tolerance = numeric("numericTolerance");
  const body = {
    type,
    prompt: text(form, "prompt").trim(),
    points: Number(text(form, "points")) || 1,
    explanation: optional(text(form, "explanation")),
    options: type === "NUMERIC" ? [] : type === "TRUE_FALSE" ? [{ label: "True", isCorrect: text(form, "trueFalse") === "true" }, { label: "False", isCorrect: text(form, "trueFalse") === "false" }] : options,
    ...(type === "NUMERIC" ? { numericAnswer: answer, numericTolerance: tolerance !== null && !Number.isNaN(tolerance) ? tolerance : 0 } : {}),
  };
  const res = await authedRequest<AdminQuiz>(questionId ? `/admin/quizzes/${quizId}/questions/${questionId}` : `/admin/quizzes/${quizId}/questions`, { method: questionId ? "PUT" : "POST", body });
  if (!res.ok) return fromApi(res.error, { prompt: text(form, "prompt") });
  revalidatePath(`/admin/courses/${courseId}/quizzes/${quizId}`);
  return { status: "success", message: questionId ? "Question saved." : "Question added." };
}

export async function deleteQuestionAction(courseId: string, quizId: string, questionId: string): Promise<FormState> {
  const res = await authedRequest(`/admin/quizzes/${quizId}/questions/${questionId}`, { method: "DELETE" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/courses/${courseId}/quizzes/${quizId}`);
  return { status: "success", message: "Question deleted." };
}

export async function moveQuestionAction(courseId: string, quizId: string, order: string[]): Promise<FormState> {
  const res = await authedRequest(`/admin/quizzes/${quizId}/questions/reorder`, { method: "POST", body: { questionIds: order } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(`/admin/courses/${courseId}/quizzes/${quizId}`);
  return { status: "success" };
}

// ───────────── exports (spec §17.1 #18) ─────────────

export async function createExportAction(_prev: FormState, form: FormData): Promise<FormState> {
  const filters = Object.fromEntries(["courseId", "status", "from", "to"].map((k) => [k, text(form, k).trim()]).filter(([, v]) => v));
  const res = await authedRequest("/admin/reports/exports", { method: "POST", body: { type: text(form, "type"), filters } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/reports");
  return { status: "success", message: "Export started. It appears below when ready, and we'll email you too." };
}
