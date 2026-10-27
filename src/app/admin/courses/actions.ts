"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { fromApi, text, type FormState } from "@/lib/forms";
import { fromIstInput, rupeesToPaise } from "@/lib/format";

const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const coursePath = (id: string) => `/admin/courses/${id}`;

/** Runs an API mutation and maps the result onto form state, revalidating the course pages. */
async function mutate(courseId: string | null, path: string, method: "POST" | "PATCH" | "PUT" | "DELETE", body: unknown, success: string): Promise<FormState> {
  const res = await authedRequest(path, { method, ...(body !== undefined ? { body } : {}) });
  if (!res.ok) return fromApi(res.error);
  if (courseId) revalidatePath(coursePath(courseId), "layout");
  revalidatePath("/admin/courses");
  return { status: "success", message: success };
}

const invalid = (field: string, message: string): FormState => ({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: { [field]: message } });

// ───────────── course ─────────────

export async function createCourseAction(_prev: FormState, form: FormData): Promise<FormState> {
  const price = rupeesToPaise(text(form, "price"));
  if (price === null || Number.isNaN(price)) return invalid("price", "Enter a price in rupees, or 0 for a free course.");
  const res = await authedRequest<AdminCourse>("/admin/courses", {
    method: "POST",
    body: { title: text(form, "title"), categoryId: text(form, "categoryId"), level: text(form, "level"), language: text(form, "language") || "en", pricePaise: price },
  });
  if (!res.ok) return fromApi(res.error, { title: text(form, "title") });
  revalidatePath("/admin/courses");
  redirect(coursePath(res.data.id));
}

export async function updateDetailsAction(courseId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const faq = text(form, "faq")
    .split(/\n\s*\n/)
    .map((block) => {
      const q = /^Q:\s*(.+)$/im.exec(block)?.[1]?.trim();
      const a = /^A:\s*([\s\S]+)$/im.exec(block)?.[1]?.trim();
      return q && a ? { q, a } : null;
    })
    .filter((x): x is { q: string; a: string } => x !== null);

  const body = {
    title: text(form, "title"),
    ...(form.has("slug") ? { slug: text(form, "slug") } : {}),
    subtitle: text(form, "subtitle").trim() || null,
    description: text(form, "description").trim() || null,
    categoryId: text(form, "categoryId"),
    level: text(form, "level"),
    language: text(form, "language"),
    learningObjectives: lines(text(form, "learningObjectives")),
    prerequisites: lines(text(form, "prerequisites")),
    targetAudience: lines(text(form, "targetAudience")),
    tagIds: form.getAll("tagIds").map(String),
    faq,
  };
  return mutate(courseId, `/admin/courses/${courseId}`, "PATCH", body, "Details saved.");
}

export async function updatePricingAction(courseId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const price = rupeesToPaise(text(form, "price"));
  if (price === null || Number.isNaN(price)) return invalid("price", "Enter a price in rupees, or 0 for a free course.");
  const promo = rupeesToPaise(text(form, "promoPrice"));
  if (Number.isNaN(promo)) return invalid("promoPrice", "Enter the offer price in rupees.");
  const lifetime = form.get("lifetime") === "on";
  const days = Number(text(form, "accessDurationDays"));
  if (!lifetime && (!Number.isInteger(days) || days < 1)) return invalid("accessDurationDays", "Enter the number of days, or choose lifetime access.");
  return mutate(
    courseId,
    `/admin/courses/${courseId}`,
    "PATCH",
    {
      pricePaise: price,
      promoPricePaise: promo,
      promoStartsAt: promo === null ? null : fromIstInput(text(form, "promoStartsAt")),
      promoEndsAt: promo === null ? null : fromIstInput(text(form, "promoEndsAt")),
      accessDurationDays: lifetime ? null : days,
      enrollmentMode: text(form, "enrollmentMode"),
    },
    "Pricing saved.",
  );
}

export async function setThumbnailAction(courseId: string, mediaAssetId: string | null): Promise<FormState> {
  return mutate(courseId, `/admin/courses/${courseId}`, "PATCH", { thumbnailAssetId: mediaAssetId }, "Thumbnail updated.");
}

export async function lifecycleAction(courseId: string, action: "publish" | "unpublish" | "archive" | "submit-review", _prev: FormState): Promise<FormState> {
  const messages = { publish: "Course published.", unpublish: "Course unpublished.", archive: "Course archived.", "submit-review": "Submitted for review." };
  return mutate(courseId, `/admin/courses/${courseId}/${action}`, "POST", action === "archive" ? {} : undefined, messages[action]);
}

export async function deleteCourseAction(courseId: string): Promise<FormState> {
  const res = await authedRequest(`/admin/courses/${courseId}`, { method: "DELETE" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

// ───────────── syllabus ─────────────

export async function addModuleAction(courseId: string, _prev: FormState, form: FormData): Promise<FormState> {
  return mutate(courseId, `/admin/courses/${courseId}/modules`, "POST", { title: text(form, "title") }, "Module added.");
}

export async function updateModuleAction(courseId: string, moduleId: string, patch: { title?: string; isPublished?: boolean }): Promise<FormState> {
  return mutate(courseId, `/admin/courses/${courseId}/modules/${moduleId}`, "PATCH", patch, "Module updated.");
}

export async function renameModuleAction(courseId: string, moduleId: string, _prev: FormState, form: FormData): Promise<FormState> {
  return updateModuleAction(courseId, moduleId, { title: text(form, "title") });
}

export async function deleteModuleAction(courseId: string, moduleId: string): Promise<FormState> {
  return mutate(courseId, `/admin/courses/${courseId}/modules/${moduleId}`, "DELETE", undefined, "Module removed.");
}

export async function reorderModulesAction(courseId: string, ids: string[]): Promise<FormState> {
  return mutate(courseId, `/admin/courses/${courseId}/modules/reorder`, "PATCH", { ids }, "Order saved.");
}

export async function addLessonAction(courseId: string, moduleId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const res = await authedRequest<{ id: string }>(`/admin/modules/${moduleId}/lessons`, { method: "POST", body: { title: text(form, "title"), type: text(form, "type") } });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(coursePath(courseId), "layout");
  redirect(`${coursePath(courseId)}/lessons/${res.data.id}`);
}

export async function reorderLessonsAction(courseId: string, moduleId: string, ids: string[]): Promise<FormState> {
  return mutate(courseId, `/admin/modules/${moduleId}/lessons/reorder`, "PATCH", { ids }, "Order saved.");
}

export async function updateLessonAction(courseId: string, moduleId: string, lessonId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const type = text(form, "type");
  const minutes = Number(text(form, "durationMinutes") || "0");
  if (!Number.isFinite(minutes) || minutes < 0) return invalid("durationMinutes", "Enter the duration in minutes.");
  const body: Record<string, unknown> = {
    title: text(form, "title"),
    description: text(form, "description").trim() || null,
    type,
    durationSeconds: Math.round(minutes * 60),
    isPreview: form.get("isPreview") === "on",
    isPublished: form.get("isPublished") === "on",
    isRequired: form.get("isRequired") === "on",
  };
  if (type === "VIDEO") body.videoAssetId = text(form, "videoAssetId") || null;
  if (type === "EXTERNAL_VIDEO") body.externalVideoUrl = text(form, "externalVideoUrl").trim() || null;
  if (type === "ARTICLE") body.articleBody = text(form, "articleBody") || null;
  return mutate(courseId, `/admin/modules/${moduleId}/lessons/${lessonId}`, "PATCH", body, "Lesson saved.");
}

export async function deleteLessonAction(courseId: string, moduleId: string, lessonId: string): Promise<FormState> {
  const res = await authedRequest(`/admin/modules/${moduleId}/lessons/${lessonId}`, { method: "DELETE" });
  if (!res.ok) return fromApi(res.error);
  revalidatePath(coursePath(courseId), "layout");
  redirect(`${coursePath(courseId)}/syllabus`);
}

// ───────────── resources ─────────────

/** Creates a resource from an uploaded file (or a link) and attaches it in one step. */
export async function addResourceAction(courseId: string, target: { courseId: string } | { moduleId: string } | { lessonId: string }, _prev: FormState, form: FormData): Promise<FormState> {
  const mediaAssetId = text(form, "mediaAssetId");
  const url = text(form, "url").trim();
  if (!mediaAssetId && !url) return invalid("file", "Upload a file or paste a link.");
  const created = await authedRequest<{ id: string }>("/admin/resources", {
    method: "POST",
    body: {
      title: text(form, "title"),
      type: mediaAssetId ? text(form, "type") || "PDF" : "LINK",
      ...(mediaAssetId ? { mediaAssetId } : { url }),
      softwareVersion: text(form, "softwareVersion").trim() || null,
      isPublicPreview: form.get("isPublicPreview") === "on",
    },
  });
  if (!created.ok) return fromApi(created.error);
  const classDate = text(form, "classDate");
  return mutate(courseId, `/admin/resources/${created.data.id}/assignments`, "POST", { target, ...(classDate ? { classDate } : {}) }, "Resource attached.");
}

export async function detachResourceAction(courseId: string, resourceId: string, assignmentId: string): Promise<FormState> {
  return mutate(courseId, `/admin/resources/${resourceId}/assignments/${assignmentId}`, "DELETE", undefined, "Resource removed.");
}
