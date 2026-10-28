import { Activity, Award, CircleCheck, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { z } from "zod";
import { isUsable, type EnrollmentView } from "@/components/course/enrollment-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import type { courseProgressSchema } from "@/lib/contracts/learning";
import { formatDate, formatDateTime, formatDuration } from "@/lib/format";

export const metadata: Metadata = { title: "Progress" };

type CourseProgress = z.infer<typeof courseProgressSchema>;

function Bar({ percent, label }: { percent: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-surface-raised">
      <div className="h-full bg-cyan" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Spec §15.1: progress (server-validated) and activity (indicative) are labelled separately. */
export default async function ProgressPage(props: PageProps<"/app/progress">) {
  const search = await props.searchParams;
  const res = await authedRequest<EnrollmentView[]>("/me/enrollments");
  const enrollments = (res.ok ? res.data : []).filter((e) => isUsable(e) || e.completedAt);
  const reports = (
    await Promise.all(enrollments.map((e) => authedRequest<CourseProgress>(`/me/progress/courses/${e.course.id}`)))
  ).flatMap((r) => (r.ok ? [r.data] : []));
  const focus = typeof search.course === "string" ? search.course : null;
  reports.sort((a, b) => (a.course.slug === focus ? -1 : b.course.slug === focus ? 1 : 0));

  return (
    <>
      <PageHeader title="Progress" description="Lesson completion is checked by the server against each lesson's rules." />
      {!reports.length ? (
        <EmptyState title="No progress yet" description="Start a course and your progress appears here, module by module." />
      ) : (
        <div className="grid gap-6">
          {reports.map((r) => (
            <section key={r.course.id} aria-labelledby={`p-${r.course.id}`} className="rounded-lg border border-border bg-surface p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id={`p-${r.course.id}`} className="font-sans text-xl font-semibold">
                    {r.course.title}
                  </h2>
                  {r.progress.completedAt ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-success">
                      <CircleCheck className="size-4" aria-hidden="true" /> Completed on {formatDate(r.progress.completedAt)}
                    </p>
                  ) : null}
                </div>
                <Link href={`/app/learn/${r.course.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {r.progress.completedAt ? "Review course" : "Continue"} →
                </Link>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <h3 className="text-sm font-medium">Progress</h3>
                  <p className="mt-1 mb-2 text-xs text-muted-foreground">Required lessons completed</p>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>
                      {r.progress.completedRequired} of {r.progress.required}
                    </span>
                    <span className="font-mono tabular">{r.progress.percent}%</span>
                  </div>
                  <Bar percent={r.progress.percent} label={`${r.course.title} progress`} />
                  <ul className="mt-4 grid gap-3">
                    {r.progress.modules.map((m) => (
                      <li key={m.id}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="truncate text-muted-foreground">{m.title}</span>
                          <span className="shrink-0 font-mono text-xs tabular">
                            {m.completedRequired}/{m.required}
                          </span>
                        </div>
                        <Bar percent={m.percent} label={`${m.title} progress`} />
                      </li>
                    ))}
                  </ul>
                  {r.quizzes.length ? (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium">Quiz scores</h3>
                      <p className="mt-1 mb-2 text-xs text-muted-foreground">Verified — graded on the server. Your best attempt counts.</p>
                      <ul className="divide-y divide-border rounded-md border border-border text-sm">
                        {r.quizzes.map((q) => (
                          <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                            <Link href={`/app/learn/${r.course.slug}/${q.id}`} className="min-w-0 truncate hover:underline">
                              {q.title}
                              {q.required ? <span className="ml-2 text-xs text-muted-foreground">required</span> : null}
                            </Link>
                            <span className={q.passed ? "text-success" : "text-muted-foreground"}>
                              {q.bestScorePercent === null ? "Not taken" : <span className="font-mono tabular">{q.bestScorePercent}%</span>}
                              {q.passed ? " · passed" : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-md border border-dashed border-border p-4">
                  <h3 className="inline-flex items-center gap-2 text-sm font-medium">
                    <Activity className="size-4 text-muted-foreground" aria-hidden="true" /> Activity
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">Indicative only — it can be off if a tab was left open or the network dropped.</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Video watched</dt>
                      <dd className="font-mono tabular">{formatDuration(r.activity.videoSecondsWatched)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Lessons opened</dt>
                      <dd className="font-mono tabular">{r.activity.lessonsOpened}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Live class joins</dt>
                      <dd className="font-mono tabular">{r.activity.liveJoinClicks}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Last activity</dt>
                      <dd>{r.activity.lastActivityAt ? formatDateTime(r.activity.lastActivityAt) : "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {r.requirements.unmet.length || r.certificate.enabled ? (
                <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
                  {r.requirements.unmet.length ? (
                    <div>
                      <h3 className="inline-flex items-center gap-2 font-medium">
                        <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" /> Still to do
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                        {r.requirements.unmet.map((u) => (
                          <li key={u.code}>{u.message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {r.certificate.enabled ? (
                    <div>
                      <h3 className="inline-flex items-center gap-2 font-medium">
                        <Award className="size-4 text-muted-foreground" aria-hidden="true" /> Certificate
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        {r.certificate.id ? (
                          <Link href="/app/certificates" className="text-primary hover:underline">
                            Your certificate is ready →
                          </Link>
                        ) : r.progress.completedAt ? (
                          "Your certificate is being prepared — we'll email you when it's issued."
                        ) : (
                          "This course awards a certificate when you complete it."
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
