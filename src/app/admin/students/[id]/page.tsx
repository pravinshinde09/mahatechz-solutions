import { ArrowLeft, Award, CircleCheck, CircleDashed, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateStatus } from "@/components/certificates/certificate-status";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { StudentAnalytics } from "@/lib/contracts/reports";
import { formatDate, formatDateTime, formatDuration } from "@/lib/format";
import { CourseOverrideForm, IssueCertificateForm, LessonOverrideForm } from "./student-forms";

export const metadata: Metadata = { title: "Student progress" };

const typeLabel: Record<string, string> = { VIDEO: "Video", EXTERNAL_VIDEO: "External video", ARTICLE: "Article", RESOURCE: "Resource", QUIZ: "Quiz", ASSIGNMENT: "Assignment", LIVE_SESSION: "Live" };

export default async function StudentPage(props: PageProps<"/admin/students/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "progress.read")) notFound();
  const { id } = await props.params;
  const res = await authedRequest<StudentAnalytics>(`/admin/analytics/students/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) notFound();
    return <p role="alert" className="text-danger">{res.error.message}</p>;
  }
  const { student, enrollments } = res.data;
  const canOverride = hasPermission(user, "progress.override");
  const canIssue = hasPermission(user, "certificate.issue");

  return (
    <>
      <Link href="/admin/enrollments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Enrolments
      </Link>
      <div className="mt-3">
        <PageHeader
          title={student.fullName}
          description={[student.email, `Registered ${formatDate(student.createdAt)}`, student.lastLoginAt ? `last signed in ${formatDateTime(student.lastLoginAt)}` : "never signed in", student.status !== "ACTIVE" ? student.status.toLowerCase().replaceAll("_", " ") : null]
            .filter(Boolean)
            .join(" · ")}
        />
      </div>

      {enrollments.length === 0 ? <p className="text-muted-foreground">No enrolments.</p> : null}
      <div className="grid gap-6">
        {enrollments.map((e) => {
          const required = e.modules.flatMap((m) => m.lessons.filter((l) => l.isRequired));
          const done = required.filter((l) => l.completedAt).length;
          return (
            <section key={e.id} aria-labelledby={`e-${e.id}`} className="rounded-lg border border-border bg-surface p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id={`e-${e.id}`} className="font-sans text-lg font-semibold">
                    {e.course.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.status.toLowerCase()} · enrolled {formatDate(e.createdAt)}
                    {e.expiresAt ? ` · access until ${formatDate(e.expiresAt)}` : ""} · last activity {e.lastActivityAt ? formatDateTime(e.lastActivityAt) : "never"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-semibold">{e.progressPercent}%</p>
                  <p className="text-xs text-muted-foreground">
                    {done}/{required.length} required lessons
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border p-4 text-sm">
                  <p className="inline-flex items-center gap-2 font-medium">
                    {e.completedAt ? <CircleCheck className="size-4 text-success" aria-hidden="true" /> : <CircleDashed className="size-4 text-muted-foreground" aria-hidden="true" />}
                    {e.completedAt ? `Completed ${formatDate(e.completedAt)}` : "Not completed"}
                    {e.completionOverridden ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 px-2 py-0.5 text-xs text-warning">
                        <ShieldAlert className="size-3" aria-hidden="true" /> admin override
                      </span>
                    ) : null}
                  </p>
                  {!e.completedAt && e.eligibility.unmet.length ? (
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {e.eligibility.unmet.filter((u) => u.code !== "CERTIFICATES_DISABLED").map((u) => (
                        <li key={u.code}>{u.message}</li>
                      ))}
                    </ul>
                  ) : null}
                  {canOverride ? (
                    <div className="mt-3">
                      <CourseOverrideForm enrollmentId={e.id} studentId={student.id} completed={!!e.completedAt} heldIncomplete={e.completionOverridden && !e.completedAt} />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-md border border-border p-4 text-sm">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Award className="size-4 text-muted-foreground" aria-hidden="true" /> Certificate
                  </p>
                  {!e.course.certificateEnabled ? (
                    <p className="mt-2 text-muted-foreground">This course doesn&apos;t award certificates.</p>
                  ) : e.certificate ? (
                    <p className="mt-2 flex flex-wrap items-center gap-2">
                      <Link href={`/admin/certificates/${e.certificate.id}`} className="font-mono text-primary hover:underline">
                        {e.certificate.certificateNumber}
                      </Link>
                      <CertificateStatus status={e.certificate.status as "ISSUED" | "REVOKED" | "SUPERSEDED"} />
                    </p>
                  ) : canIssue ? (
                    <div className="mt-2">
                      <p className="mb-2 text-muted-foreground">{e.eligibility.eligible ? "Eligible — ready to issue." : "Not eligible yet."}</p>
                      <IssueCertificateForm enrollmentId={e.id} studentId={student.id} eligible={e.eligibility.eligible} />
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Not issued yet.</p>
                  )}
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">Lesson-by-lesson progress</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-2 font-normal">Lesson</th>
                        <th className="py-2 font-normal">Status</th>
                        <th className="py-2 text-right font-normal">Video watched</th>
                        <th className="py-2 text-right font-normal">Quiz best</th>
                        <th className="py-2 text-right font-normal">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    {e.modules.map((m) => (
                      <tbody key={m.id}>
                        <tr>
                          <th colSpan={5} scope="colgroup" className="pt-3 pb-1 text-xs font-medium text-muted-foreground">
                            {m.title}
                          </th>
                        </tr>
                        {m.lessons.map((l) => (
                          <tr key={l.id} className="border-b border-border/60 align-top">
                            <td className="py-2 pr-3">
                              {l.title}
                              <span className="block text-xs text-muted-foreground">
                                {typeLabel[l.type] ?? l.type}
                                {l.isRequired ? "" : " · optional"}
                              </span>
                            </td>
                            <td className="py-2 pr-3">
                              {l.completedAt ? (
                                <span className="text-success">
                                  Completed {formatDate(l.completedAt)}
                                  {l.completionOverridden ? <span className="block text-xs text-warning">admin override</span> : l.selfReported ? <span className="block text-xs text-muted-foreground">self-reported</span> : null}
                                </span>
                              ) : l.lastActivityAt ? (
                                <span className="text-muted-foreground">Opened {formatDate(l.lastActivityAt)}</span>
                              ) : (
                                <span className="text-muted-foreground">Not started</span>
                              )}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums">{l.watchedSeconds ? formatDuration(l.watchedSeconds) : "—"}</td>
                            <td className="py-2 text-right font-mono tabular-nums">{l.bestScorePercent === null ? "—" : `${l.bestScorePercent}%`}</td>
                            <td className="py-2 pl-3 text-right">{canOverride && !l.completedAt ? <LessonOverrideForm enrollmentId={e.id} studentId={student.id} lessonId={l.id} title={l.title} /> : null}</td>
                          </tr>
                        ))}
                      </tbody>
                    ))}
                  </table>
                </div>
              </details>
            </section>
          );
        })}
      </div>
    </>
  );
}
