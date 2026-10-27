import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { NewCourseForm, type CategoryOption } from "./new-course-form";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const user = await requireStaff();
  if (!hasPermission(user, "course.create")) notFound();
  const res = await authedRequest<{ id: string; name: string; children: { id: string; name: string }[] }[]>("/admin/categories");
  const categories: CategoryOption[] = res.ok
    ? res.data.flatMap((c) => [{ id: c.id, label: c.name }, ...c.children.map((child) => ({ id: child.id, label: `${c.name} › ${child.name}` }))])
    : [];
  return (
    <>
      <PageHeader title="New course" description="Start with the basics. Everything can be changed later while the course is a draft." />
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6 md:p-8">
        {categories.length ? (
          <NewCourseForm categories={categories} />
        ) : (
          <p>
            Create a category first on the{" "}
            <Link href="/admin/categories" className="text-primary underline">
              categories page
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
