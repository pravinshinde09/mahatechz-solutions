import { ArrowLeft, ArrowRight, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LessonStage } from "@/components/learn/lesson-stage";
import { ResourceList } from "@/components/learn/resource-list";
import { SyllabusNav } from "@/components/learn/syllabus-nav";
import { SyllabusSheet } from "@/components/learn/syllabus-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authedRequest } from "@/lib/api/server";
import type { AnnouncementView, LearnCourse, LessonContent, Playback } from "@/lib/contracts/learning";
import { formatDateTime } from "@/lib/format";
import { getLearnCourse } from "../data";
import { NoAccess } from "../no-access";
import { MarkAnnouncementsRead } from "./mark-read";

export const metadata: Metadata = { title: "Learn" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tabs = ["overview", "resources", "announcements"] as const;

export default async function LessonPage(props: PageProps<"/app/learn/[courseSlug]/[lessonId]">) {
  const { courseSlug, lessonId } = await props.params;
  const search = await props.searchParams;
  const tab = tabs.find((t) => t === search.tab) ?? "overview";

  const [courseRes, lessonRes] = await Promise.all([
    getLearnCourse(courseSlug),
    UUID.test(lessonId) ? authedRequest<LessonContent>(`/lessons/${lessonId}`) : Promise.resolve(null),
  ]);
  if (!courseRes.ok) return <NoAccess error={courseRes.error} courseSlug={courseSlug} />;
  if (!lessonRes || !lessonRes.ok) return <NoAccess error={lessonRes?.error ?? { code: "NOT_FOUND", message: "" }} courseSlug={courseSlug} />;
  const course = courseRes.data;
  const lesson = lessonRes.data;
  if (lesson.courseId !== course.course.id) return <NoAccess error={{ code: "NOT_FOUND", message: "" }} courseSlug={courseSlug} />;

  const [playbackRes, announcementsRes] = await Promise.all([
    lesson.hasPlayback ? authedRequest<Playback>(`/lessons/${lesson.id}/playback`) : Promise.resolve(null),
    authedRequest<AnnouncementView[]>(`/learn/courses/${course.course.id}/announcements`),
  ]);
  const playback = playbackRes?.ok ? playbackRes.data : null;
  const announcements = announcementsRes.ok ? announcementsRes.data : [];

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const titleOf = (id: string | null) => allLessons.find((l) => l.id === id)?.title ?? "";
  const base = `/app/learn/${course.course.slug}`;
  const next = lesson.nextLessonId ? { href: `${base}/${lesson.nextLessonId}`, title: titleOf(lesson.nextLessonId) } : null;
  const required = course.modules.reduce((n, m) => n + m.requiredCount, 0);
  const done = course.modules.reduce((n, m) => n + m.completedRequiredCount, 0);
  const progressText = `${done}/${required}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 grid max-h-[calc(100dvh-7rem)] gap-4 overflow-y-auto pr-1">
          <CourseHeader course={course} done={done} required={required} />
          <SyllabusNav course={course} currentLessonId={lesson.id} />
        </div>
      </aside>

      <div className="grid min-w-0 content-start gap-5">
        <div className="grid gap-3 lg:hidden">
          <CourseHeader course={course} done={done} required={required} />
          <SyllabusSheet progress={progressText}>
            <SyllabusNav course={course} currentLessonId={lesson.id} />
          </SyllabusSheet>
        </div>

        <header>
          <p className="text-sm text-muted-foreground">{lesson.moduleTitle}</p>
          <h1 className="mt-1 font-sans text-2xl leading-8 font-semibold md:text-3xl md:leading-9">{lesson.title}</h1>
        </header>

        <LessonStage key={lesson.id} lesson={lesson} playback={playback} next={next} />

        <nav aria-label="Lesson navigation" className="flex flex-wrap justify-between gap-3">
          {lesson.prevLessonId ? (
            <Button asChild variant="outline">
              <Link href={`${base}/${lesson.prevLessonId}`}>
                <ArrowLeft /> <span className="max-w-[14rem] truncate">{titleOf(lesson.prevLessonId)}</span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild variant={lesson.progress.state === "completed" ? "default" : "outline"}>
              <Link href={next.href}>
                <span className="max-w-[14rem] truncate">{next.title}</span> <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </nav>

        <Tabs defaultValue={tab} className="mt-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources{lesson.resources.length ? ` (${lesson.resources.length})` : ""}</TabsTrigger>
            <TabsTrigger value="announcements">
              Announcements
              {course.unreadAnnouncements ? (
                <span className="ml-1.5 inline-flex size-2 rounded-full bg-cyan" aria-label={`${course.unreadAnnouncements} unread`} />
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3">
            {lesson.descriptionHtml ? (
              <div className="prose-content text-sm" dangerouslySetInnerHTML={{ __html: lesson.descriptionHtml }} />
            ) : (
              <p className="text-sm text-muted-foreground">No description for this lesson.</p>
            )}
          </TabsContent>
          <TabsContent value="resources" className="grid gap-4 pt-3">
            <ResourceList resources={lesson.resources} />
            <Link href={`${base}/resources`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <FolderOpen className="size-4" aria-hidden="true" /> All course resources and daily notes
            </Link>
          </TabsContent>
          <TabsContent value="announcements" className="pt-3">
            {course.unreadAnnouncements ? <MarkAnnouncementsRead course={course.course.id} /> : null}
            {announcements.length ? (
              <ul className="grid gap-3">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-md border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">
                        {!a.read ? <span className="mr-2 inline-block size-2 rounded-full bg-cyan align-middle" aria-label="New" /> : null}
                        {a.title}
                      </h3>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={a.publishedAt}>
                        {formatDateTime(a.publishedAt)}
                      </time>
                    </div>
                    <div className="prose-content mt-2 text-sm" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
                    {a.author ? <p className="mt-2 text-xs text-muted-foreground">— {a.author}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CourseHeader({ course, done, required }: { course: LearnCourse; done: number; required: number }) {
  const percent = course.enrollment?.progressPercent ?? 0;
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <Link href="/app/courses" className="text-xs text-muted-foreground hover:text-foreground">
        ← My courses
      </Link>
      <p className="mt-2 leading-6 font-semibold">{course.course.title}</p>
      {course.viewer === "student" ? (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {done} of {required} required lessons
            </span>
            <span className="font-mono tabular">{percent}%</span>
          </div>
          <div role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full bg-cyan" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Staff preview</p>
      )}
    </div>
  );
}
