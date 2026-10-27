import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { SessionForm } from "../live-forms";

export const metadata: Metadata = { title: "Schedule a live class" };

export default async function NewLivePage(props: PageProps<"/admin/live/new">) {
  const user = await requireStaff();
  if (!hasPermission(user, "live.manage")) notFound();
  const search = await props.searchParams;
  // Instructors only get their assigned courses back from this endpoint.
  const result = await apiPage<{ id: string; title: string; status: string }, unknown>("/admin/courses?pageSize=100", { authed: true });
  const courses = (result?.data ?? []).filter((c) => c.status !== "ARCHIVED").map((c) => ({ value: c.id, label: c.title }));
  return (
    <div className="max-w-2xl">
      <Link href="/admin/live" className="text-sm text-muted-foreground hover:text-foreground">
        ← Live classes
      </Link>
      <PageHeader title="Schedule a live class" />
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        {courses.length ? (
          <SessionForm mode="create" courses={courses} defaults={{ ...(typeof search.courseId === "string" ? { courseId: search.courseId } : {}) }} />
        ) : (
          <p className="text-muted-foreground">Create a course first — live classes belong to a course.</p>
        )}
      </section>
    </div>
  );
}
