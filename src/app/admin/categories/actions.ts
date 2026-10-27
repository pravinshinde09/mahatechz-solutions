"use server";

import { revalidatePath } from "next/cache";
import { authedRequest } from "@/lib/api/server";
import { fromApi, text, type FormState } from "@/lib/forms";

async function run(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown, message: string): Promise<FormState> {
  const res = await authedRequest(path, { method, ...(body !== undefined ? { body } : {}) });
  if (!res.ok) return fromApi(res.error);
  revalidatePath("/admin/categories");
  return { status: "success", message };
}

export async function createCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parentId = text(form, "parentId");
  return run(
    "/admin/categories",
    "POST",
    { name: text(form, "name"), description: text(form, "description").trim() || null, ...(parentId ? { parentId } : {}) },
    "Category created.",
  );
}

export async function setCategoryActiveAction(id: string, isActive: boolean): Promise<FormState> {
  return run(`/admin/categories/${id}`, "PATCH", { isActive }, isActive ? "Category activated." : "Category hidden.");
}

export async function deleteCategoryAction(id: string): Promise<FormState> {
  return run(`/admin/categories/${id}`, "DELETE", undefined, "Category deleted.");
}

export async function createTagAction(_prev: FormState, form: FormData): Promise<FormState> {
  return run("/admin/tags", "POST", { type: text(form, "type"), name: text(form, "name") }, "Tag created.");
}

export async function deleteTagAction(id: string): Promise<FormState> {
  return run(`/admin/tags/${id}`, "DELETE", undefined, "Tag deleted.");
}
