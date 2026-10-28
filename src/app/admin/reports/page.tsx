import { Download, Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage, authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { ReportExportView } from "@/lib/contracts/reports";
import { formatDateTime } from "@/lib/format";
import { ExportForm, RefreshWhilePending } from "./export-form";

export const metadata: Metadata = { title: "Reports" };

const typeLabel: Record<string, string> = { STUDENTS: "Students", ENROLLMENTS: "Enrolments", PROGRESS: "Progress", PAYMENTS: "Payments", CERTIFICATES: "Certificates" };

/** The API expires links hourly; between runs a link past its time is already unusable. */
const isExpired = (r: ReportExportView) => r.status === "EXPIRED" || (r.expiresAt !== null && Date.parse(r.expiresAt) <= Date.now());

/** Spec §22.3 "Reports": export builder and the history of your exports. */
export default async function ReportsPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "report.export")) notFound();
  const all = hasPermission(user, "enrollment.grant"); // admins; instructors export their own courses only
  const types = [
    { value: "ENROLLMENTS", label: "Enrolments" },
    { value: "PROGRESS", label: "Progress (per enrolment)" },
    { value: "CERTIFICATES", label: "Certificates" },
    ...(all ? [{ value: "STUDENTS", label: "Students" }] : []),
    ...(hasPermission(user, "payment.read.details") ? [{ value: "PAYMENTS", label: "Payments" }] : []),
  ];
  const [history, courses] = await Promise.all([authedRequest<ReportExportView[]>("/admin/reports/exports"), apiPage<{ id: string; title: string }>("/admin/courses?pageSize=100", { authed: true })]);
  const rows = history.ok ? history.data : [];

  return (
    <>
      <PageHeader title="Reports" description="CSV exports are built in the background. Each download link works for 24 hours, only for you; the files contain personal data — store them securely." />
      <RefreshWhilePending pending={rows.some((r) => r.status === "PENDING")} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section aria-labelledby="new-export" className="rounded-lg border border-border bg-surface p-6 xl:self-start">
          <h2 id="new-export" className="mb-4 font-sans text-lg font-semibold">
            New export
          </h2>
          <ExportForm types={types} courses={(courses?.data ?? []).map((c) => ({ value: c.id, label: c.title }))} />
          <p className="mt-4 text-xs text-muted-foreground">Progress exports label each column: progress (server-validated), verified (quiz scores) and activity (indicative).</p>
        </section>
        <section aria-labelledby="history" className="min-w-0">
          <h2 id="history" className="mb-3 font-sans text-lg font-semibold">
            Your exports
          </h2>
          {!rows.length ? (
            <EmptyState title="No exports yet" description="Create one on the left; it appears here when it's ready." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {rows.map((r) => {
                const expired = isExpired(r);
                const filters = [r.filters.status?.toLowerCase(), r.filters.from && `from ${r.filters.from}`, r.filters.to && `to ${r.filters.to}`, r.filters.courseId && "one course"].filter(Boolean).join(", ");
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {typeLabel[r.type]} <span className="font-normal text-muted-foreground">{filters ? `· ${filters}` : "· everything"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatDateTime(r.createdAt)}
                        {r.rowCount !== null ? ` · ${r.rowCount.toLocaleString("en-IN")} rows` : ""}
                        {r.status === "READY" && r.expiresAt && !expired ? ` · link expires ${formatDateTime(r.expiresAt)}` : ""}
                      </p>
                      {r.status === "FAILED" ? <p className="text-xs text-danger">Failed: {r.error}</p> : null}
                    </div>
                    {r.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Building…
                      </span>
                    ) : r.status === "READY" && !expired ? (
                      <a href={`/api/admin/exports/${r.id}/download`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                        <Download className="size-4" aria-hidden="true" /> Download CSV
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{r.status === "FAILED" ? "Failed" : "Expired"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
