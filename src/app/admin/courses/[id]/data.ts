import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { authedRequest } from "@/lib/api/server";
import type { AdminCourse } from "@/lib/contracts/catalog";

/** One API call per request, shared by the editor layout and its tabs. */
export const getAdminCourse = cache(async (id: string): Promise<AdminCourse> => {
  const res = await authedRequest<AdminCourse>(`/admin/courses/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  return res.data;
});

export const getCategoryOptions = cache(async () => {
  const res = await authedRequest<{ id: string; name: string; children: { id: string; name: string }[] }[]>("/admin/categories");
  return res.ok ? res.data.flatMap((c) => [{ value: c.id, label: c.name }, ...c.children.map((child) => ({ value: child.id, label: `${c.name} › ${child.name}` }))]) : [];
});

export const getTags = cache(async () => {
  const res = await authedRequest<{ id: string; type: string; name: string }[]>("/tags");
  return res.ok ? res.data : [];
});
