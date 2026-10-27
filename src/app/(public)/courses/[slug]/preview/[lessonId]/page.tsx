import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/course/lesson-player";
import { apiRequest } from "@/lib/api/server";
import type { LessonType } from "@/lib/contracts/catalog";

export const metadata: Metadata = { title: "Free preview", robots: { index: false } };

interface Preview {
  lessonId: string;
  title: string;
  type: LessonType;
  durationSeconds: number;
  video: { url: string; kind: "embed" | "file"; expiresAt: string | null } | null;
  externalEmbedUrl: string | null;
  articleHtml: string | null;
}

/** Free preview lesson (FR-CAT-04): no login needed; the API checks the lesson is a published preview. */
export default async function PreviewPage(props: PageProps<"/courses/[slug]/preview/[lessonId]">) {
  const { slug, lessonId } = await props.params;
  const res = await apiRequest<Preview>(`/courses/${encodeURIComponent(slug)}/preview/${encodeURIComponent(lessonId)}`);
  if (!res.ok) notFound();
  const lesson = res.data;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to course
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.02em] text-cyan uppercase">Free preview</p>
      <h1 className="mt-2 text-[28px] leading-[34px] font-semibold">{lesson.title}</h1>
      <div className="mt-6">
        <LessonPlayer title={lesson.title} video={lesson.video} externalEmbedUrl={lesson.externalEmbedUrl} articleHtml={lesson.articleHtml} />
      </div>
    </div>
  );
}
