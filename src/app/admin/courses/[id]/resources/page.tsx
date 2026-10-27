import type { Metadata } from "next";
import Link from "next/link";
import { authedRequest } from "@/lib/api/server";
import { ResourcePanel, type CourseResource } from "../resource-panel";
import { getAdminCourse } from "../data";

export const metadata: Metadata = { title: "Resources & notes" };

export default async function CourseResourcesPage(props: PageProps<"/admin/courses/[id]/resources">) {
  const { id } = await props.params;
  const [course, res] = await Promise.all([getAdminCourse(id), authedRequest<CourseResource[]>(`/admin/courses/${id}/resources`)]);
  const all = res.ok ? res.data : [];
  const courseLevel = all.filter((r) => r.courseId);
  const lessonTitles = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, `${m.title} › ${l.title}`] as const)));
  const lessonLevel = all.filter((r) => r.lessonId);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <h2 className="font-sans text-xl font-semibold">Course resources &amp; daily notes</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Available throughout the course. Give class notes a date and students see them in a timeline grouped by day.
        </p>
        <ResourcePanel courseId={id} target={{ courseId: id }} resources={courseLevel} withClassDate />
      </section>
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <h2 className="font-sans text-xl font-semibold">Attached to lessons</h2>
        {lessonLevel.length ? (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border text-sm">
            {lessonLevel.map((r) => (
              <li key={r.assignmentId} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                <span className="font-medium">{r.resource.title}</span>
                <Link href={`/admin/courses/${id}/lessons/${r.lessonId}`} className="text-primary hover:underline">
                  {lessonTitles.get(r.lessonId!) ?? "Lesson"}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Attach files to individual lessons from the lesson editor.</p>
        )}
      </section>
    </div>
  );
}
