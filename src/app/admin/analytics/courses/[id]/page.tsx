import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { CourseAnalytics } from "@/lib/contracts/reports";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Course analytics" };

const typeLabel: Record<string, string> = { VIDEO: "Video", EXTERNAL_VIDEO: "External video", ARTICLE: "Article", RESOURCE: "Resource", QUIZ: "Quiz", ASSIGNMENT: "Assignment", LIVE_SESSION: "Live" };
const reasonLabel = { INACTIVE: "No activity", BEHIND_SCHEDULE: "Behind pace" } as const;

/** Spec §17.1 #12 / §22.3 "Performance analytics": completion funnel, at-risk list, quiz stats. */
export default async function CourseAnalyticsPage(props: PageProps<"/admin/analytics/courses/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "progress.read")) notFound();
  const { id } = await props.params;
  const res = await authedRequest<CourseAnalytics>(`/admin/analytics/courses/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) notFound();
    return <p role="alert" className="text-danger">{res.error.message}</p>;
  }
  const a = res.data;
  const base = Math.max(a.enrollments.total, 1);

  return (
    <>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Dashboard
      </Link>
      <div className="mt-3">
        <PageHeader title={a.course.title} description="Progress figures are server-validated; at-risk is an activity heuristic. Quiz scores are server-graded." />
      </div>

      <section aria-label="Summary" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Active enrolments" value={String(a.enrollments.active)} note={`${a.enrollments.total} enrolments in total`} />
        <Tile label="Completed" value={String(a.enrollments.completed)} note="Rule-based or admin override" />
        <Tile label="Completion rate" value={a.completionRate.rate === null ? "—" : `${a.completionRate.rate}%`} note={`${a.completionRate.completed} of ${a.completionRate.denominator} enrolments ≥ 30 days old`} />
        <Tile label="Average progress" value={a.averageProgress === null ? "—" : `${a.averageProgress}%`} note="Active enrolments" />
      </section>

      <section aria-labelledby="funnel-heading" className="mb-6 rounded-lg border border-border bg-surface p-5">
        <h2 id="funnel-heading" className="font-sans text-base font-semibold">
          Lesson funnel
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">Students who completed each required lesson, in syllabus order, out of {a.enrollments.total} enrolled. A sharp drop marks where students stall.</p>
        {a.funnel.length ? (
          <ol className="grid gap-2.5">
            {a.funnel.map((l, i) => {
              const share = Math.round((100 * l.completed) / base);
              return (
                <li key={l.lessonId} className="grid gap-1 text-sm sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center sm:gap-4">
                  <span className="min-w-0 truncate" title={`${l.moduleTitle} › ${l.title}`}>
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    {l.title} <span className="text-xs text-muted-foreground">· {typeLabel[l.type] ?? l.type}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="h-3 flex-1 overflow-hidden rounded-r-sm bg-surface-raised" aria-hidden="true">
                      <span className="block h-full rounded-r-[4px] bg-[var(--chart-1)]" style={{ width: `${share}%` }} />
                    </span>
                    <span className="w-44 shrink-0 text-right font-mono text-xs whitespace-nowrap tabular-nums">
                      {l.completed} <span className="text-muted-foreground">({share}%) · {l.opened} opened</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No required lessons are published yet.</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="risk-heading" className="min-w-0 rounded-lg border border-border bg-surface p-5">
          <h2 id="risk-heading" className="inline-flex items-center gap-2 font-sans text-base font-semibold">
            <AlertTriangle className="size-4 text-warning" aria-hidden="true" /> At-risk students
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Activity heuristic: no learning for {a.atRiskThresholds.inactiveDays} days, or more than {a.atRiskThresholds.behindByPoints} points behind the expected pace
            {a.course.recommendedDurationDays ? ` (${a.course.recommendedDurationDays}-day course)` : " (set a recommended duration on the course to use pace)"}.
          </p>
          {a.atRisk === null ? (
            <p className="text-sm text-muted-foreground">Shown once the course has two weeks of activity data.</p>
          ) : a.atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is at risk right now.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {a.atRisk.map((s) => (
                <li key={s.enrollmentId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <Link href={`/admin/students/${s.student.id}`} className="font-medium hover:underline">
                      {s.student.fullName}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {s.reasons.map((r) => reasonLabel[r]).join(" · ")} · last active {s.lastActivityAt ? formatDate(s.lastActivityAt) : "never"}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {s.progressPercent}%{s.expectedPercent !== null ? <span className="text-muted-foreground"> / {s.expectedPercent}% expected</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="quiz-heading" className="min-w-0 rounded-lg border border-border bg-surface p-5">
          <h2 id="quiz-heading" className="font-sans text-base font-semibold">
            Quizzes
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">Verified outcomes: server-graded, best attempt per student.</p>
          {a.quizzes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 font-normal">Quiz</th>
                    <th className="py-2 text-right font-normal">Students</th>
                    <th className="py-2 text-right font-normal">Avg best</th>
                    <th className="py-2 text-right font-normal">Pass rate</th>
                  </tr>
                </thead>
                <tbody>
                  {a.quizzes.map((q) => (
                    <tr key={q.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2">
                        <Link href={`/admin/courses/${a.course.id}/quizzes/${q.id}`} className="hover:underline">
                          {q.title}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{q.submittedAttempts} attempts</span>
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums">{q.students}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{q.averageBestScore === null ? "—" : `${q.averageBestScore}%`}</td>
                      <td className="py-2 text-right font-mono tabular-nums">{q.passRate === null ? "—" : `${q.passRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No quizzes yet — add a Quiz lesson in the syllabus to check understanding.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
