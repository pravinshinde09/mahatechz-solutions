import { ArrowRight, Clock, FileText, LifeBuoy, Megaphone, PlayCircle, Radio } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { sessionTime } from "@/components/live/session-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";
import type { Dashboard } from "@/lib/contracts/learning";
import { formatDate, formatDateTime } from "@/lib/format";
import { VerifyEmailBanner } from "./resend-verification";

function Progress({ percent, label }: { percent: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-surface-raised">
      <div className="h-full bg-cyan" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Panel({ title, id, href, linkLabel, children }: { title: string; id: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="font-sans text-lg font-semibold">
          {title}
        </h2>
        {href ? (
          <Link href={href} className="text-sm text-primary hover:underline">
            {linkLabel ?? "View all"}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Spec §14.1 — every widget from one `/me/dashboard` call. */
export default async function StudentDashboardPage() {
  const user = await requireUser();
  const res = await authedRequest<Dashboard>("/me/dashboard");
  const firstName = user.fullName.split(" ")[0];
  if (!res.ok) {
    return (
      <>
        <PageHeader title={`Hello, ${firstName}`} />
        <p className="text-danger">{res.error.message}</p>
      </>
    );
  }
  const d = res.data;
  const active = d.courses.filter((c) => c.status === "ACTIVE");

  return (
    <>
      <PageHeader title={`Hello, ${firstName}`} description="Your learning at a glance." />
      {!user.emailVerified ? <VerifyEmailBanner email={user.email} /> : null}

      {d.pendingPayments.length ? (
        <Alert variant="info" className="mb-6">
          <Clock />
          <AlertDescription>
            {d.pendingPayments.length === 1 ? `Your payment for ${d.pendingPayments[0]!.courseTitle} is` : `${d.pendingPayments.length} offline payments are`} being verified.{" "}
            <Link href="/app/payments" className="underline">
              View status
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {!d.courses.length ? (
        <EmptyState
          title="Start your first course"
          description="Browse the catalogue to find a course. Your progress, live classes and notes will appear here."
          action={
            <Button asChild size="lg">
              <Link href="/courses">
                Browse courses <ArrowRight />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6">
          {d.continueLearning ? (
            <section aria-labelledby="continue-heading" className="relative overflow-hidden rounded-lg border border-primary/30 bg-surface p-6 shadow-glow">
              <p id="continue-heading" className="text-xs font-medium tracking-[0.02em] text-cyan uppercase">
                Continue learning
              </p>
              <h2 className="mt-2 font-sans text-xl leading-7 font-semibold">{d.continueLearning.lessonTitle}</h2>
              <p className="text-sm text-muted-foreground">{d.continueLearning.courseTitle}</p>
              {d.continueLearning.percent > 0 ? (
                <div className="mt-4 max-w-sm">
                  <Progress percent={d.continueLearning.percent} label="Lesson progress" />
                </div>
              ) : null}
              <Button asChild className="mt-5">
                <Link href={`/app/learn/${d.continueLearning.courseSlug}/${d.continueLearning.lessonId}`}>
                  <PlayCircle /> {d.continueLearning.positionSeconds > 0 ? "Resume" : "Start lesson"}
                </Link>
              </Button>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Panel title="My courses" id="courses-heading" href="/app/courses">
              <div className="mb-5">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall — required lessons across active courses</span>
                  <span className="font-mono tabular">
                    {d.overall.completedRequired}/{d.overall.required}
                  </span>
                </div>
                <Progress percent={d.overall.percent} label="Overall progress" />
              </div>
              <ul className="grid gap-3">
                {(active.length ? active : d.courses).slice(0, 5).map((c) => (
                  <li key={c.enrollmentId} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={c.status === "ACTIVE" ? `/app/learn/${c.course.slug}` : `/courses/${c.course.slug}`} className="leading-6 font-medium hover:text-primary">
                        {c.course.title}
                      </Link>
                      <span className="shrink-0 font-mono text-sm tabular">{c.progressPercent}%</span>
                    </div>
                    <div className="mt-2">
                      <Progress percent={c.progressPercent} label={`${c.course.title} progress`} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.completedAt ? `Completed ${formatDate(c.completedAt)}` : c.status !== "ACTIVE" ? "Access ended" : c.nextLesson ? `Next: ${c.nextLesson.title}` : "All lessons done"}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="grid content-start gap-6">
              <Panel title="Upcoming live classes" id="live-heading" href="/app/live">
                {d.upcomingLive.length ? (
                  <ul className="grid gap-3">
                    {d.upcomingLive.map((s) => (
                      <li key={s.id} className="flex items-start gap-3">
                        <Radio className={`mt-0.5 size-4 shrink-0 ${s.joinOpen ? "text-danger" : "text-cyan"}`} aria-hidden="true" />
                        <div className="min-w-0">
                          <Link href={`/app/live/${s.id}`} className="leading-5 font-medium hover:text-primary">
                            {s.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {s.courseTitle} · <span className="font-mono tabular">{sessionTime(s)}</span>
                          </p>
                          {s.joinOpen ? <p className="text-xs font-medium text-danger">Join is open now</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No live classes scheduled in the next 7 days.</p>
                )}
              </Panel>

              {d.recentResources.length ? (
                <Panel title="New notes & resources" id="resources-heading">
                  <ul className="grid gap-3">
                    {d.recentResources.map((r) => (
                      <li key={`${r.resourceId}-${r.createdAt}`} className="flex items-start gap-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden="true" />
                        <div className="min-w-0">
                          <a href={`/api/resources/${r.resourceId}/download`} className="leading-5 font-medium hover:text-primary">
                            {r.title}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            <Link href={`/app/learn/${r.courseSlug}/resources?group=date`} className="hover:underline">
                              {r.courseTitle}
                            </Link>
                            {r.classDate ? ` · class of ${formatDate(r.classDate)}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Announcements" id="announcements-heading" href="/app/notifications" linkLabel={d.unreadNotifications ? `${d.unreadNotifications} unread notifications` : "Notifications"}>
              {d.announcements.length ? (
                <ul className="grid gap-3">
                  {d.announcements.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <Megaphone className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="leading-5 font-medium">
                          {!a.read ? <span className="mr-1.5 inline-block size-2 rounded-full bg-cyan align-middle" aria-label="New" /> : null}
                          {a.course ? (
                            <Link href={`/app/learn/${a.course.slug}?tab=announcements`} className="hover:text-primary">
                              {a.title}
                            </Link>
                          ) : (
                            a.title
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.course?.title ?? "Mahatecz Learning"} · {formatDateTime(a.publishedAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
              )}
            </Panel>

            {d.recentLessons.length ? (
              <Panel title="Recently opened" id="recent-heading" href="/app/progress" linkLabel="Progress">
                <ul className="grid gap-2">
                  {d.recentLessons.map((l) => (
                    <li key={l.lessonId}>
                      <Link href={`/app/learn/${l.courseSlug}/${l.lessonId}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-surface-raised">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{l.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{l.courseTitle}</span>
                        </span>
                        <span className={`shrink-0 text-xs ${l.completed ? "text-success" : "text-muted-foreground"}`}>{l.completed ? "Completed" : "In progress"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>
        </div>
      )}

      <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <LifeBuoy className="size-4" aria-hidden="true" /> Stuck?{" "}
        <Link href="/app/support/new" className="text-primary hover:underline">
          Ask support
        </Link>
      </p>
    </>
  );
}
