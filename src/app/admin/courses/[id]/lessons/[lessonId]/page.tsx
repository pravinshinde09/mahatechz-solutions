import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import { ResourcePanel, type CourseResource } from "../../resource-panel";
import { getAdminCourse } from "../../data";
import { LessonForm } from "./lesson-form";

export const metadata: Metadata = { title: "Edit lesson" };

export default async function LessonEditorPage(props: PageProps<"/admin/courses/[id]/lessons/[lessonId]">) {
  const { id, lessonId } = await props.params;
  const course = await getAdminCourse(id);
  const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId && !l.archivedAt));
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  if (!mod || !lesson) notFound();
  const resources = await authedRequest<CourseResource[]>(`/admin/courses/${id}/resources`);

  return (
    <div className="grid gap-6">
      <Link href={`/admin/courses/${id}/syllabus`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Syllabus · {mod.title}
      </Link>
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <LessonForm key={`${lesson.id}-${lesson.videoAssetId}`} courseId={id} moduleId={mod.id} lesson={lesson} />
      </section>
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <h2 className="font-sans text-xl font-semibold">Lesson resources</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">Notes, PDFs and practice drawings students can download from this lesson.</p>
        <ResourcePanel courseId={id} target={{ lessonId }} resources={(resources.ok ? resources.data : []).filter((r) => r.lessonId === lessonId)} />
      </section>
    </div>
  );
}
