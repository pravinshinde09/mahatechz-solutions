import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { EnrollmentRowActions, GrantForm } from "./enrollment-forms";

export const metadata: Metadata = { title: "Enrolments" };

interface Row {
  id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  source: string;
  expiresAt: string | null;
  progressPercent: number;
  grantReason: string | null;
  grantedBy: string | null;
  createdAt: string;
  course: { id: string; title: string };
  student: { fullName: string; email: string };
}

const sourceLabel: Record<string, string> = { ONLINE: "Online payment", OFFLINE: "Offline payment", ADMIN_GRANT: "Granted", FREE: "Free", BULK_IMPORT: "Bulk import" };
const statusTone: Record<string, string> = { ACTIVE: "text-success", PENDING: "text-warning", EXPIRED: "text-muted-foreground", SUSPENDED: "text-warning", REVOKED: "text-danger" };

export default async function EnrollmentsPage(props: PageProps<"/admin/enrollments">) {
  const user = await requireStaff();
  if (!hasPermission(user, "enrollment.read")) notFound();
  const raw = await props.searchParams;
  const pick = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string) : undefined);
  const filters = { q: pick("q"), status: pick("status"), source: pick("source"), courseId: pick("courseId") };
  const query = new URLSearchParams(Object.entries({ ...filters, pageSize: "50" }).filter((e): e is [string, string] => Boolean(e[1])));
  const [result, courses] = await Promise.all([
    apiPage<Row, { total: number }>(`/admin/enrollments?${query}`, { authed: true }),
    apiPage<{ id: string; title: string; status: string }>("/admin/courses?pageSize=100", { authed: true }),
  ]);
  const rows = result?.data ?? [];
  const courseOptions = (courses?.data ?? []).filter((c) => c.status !== "ARCHIVED").map((c) => ({ value: c.id, label: c.title }));
  const canGrant = hasPermission(user, "enrollment.grant");
  const canChange = hasPermission(user, "enrollment.revoke");

  return (
    <>
      <PageHeader title="Enrolments" description="Who has access to which course, and why. Grants and changes need a reason and are audit-logged." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <form method="get" className="mb-4 flex flex-wrap gap-3" role="search">
            <input name="q" defaultValue={filters.q} placeholder="Student name or email" aria-label="Search" className="h-10 min-w-48 flex-1 rounded-sm border border-input bg-surface px-3" />
            <select name="courseId" defaultValue={filters.courseId ?? ""} aria-label="Course" className="h-10 max-w-56 rounded-sm border border-input bg-surface px-3">
              <option value="">All courses</option>
              {courseOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className="h-10 rounded-sm border border-input bg-surface px-3">
              <option value="">All statuses</option>
              {["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED", "REVOKED"].map((s) => (
                <option key={s} value={s}>
                  {s.toLowerCase()}
                </option>
              ))}
            </select>
            <select name="source" defaultValue={filters.source ?? ""} aria-label="Source" className="h-10 rounded-sm border border-input bg-surface px-3">
              <option value="">All sources</option>
              {Object.entries(sourceLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-raised">
              Filter
            </button>
          </form>
          {rows.length === 0 ? (
            <EmptyState title="No enrolments match" description="Enrolments appear when students buy, are approved offline, enrol free, or are granted access." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {rows.map((e) => (
                <li key={e.id} className="grid gap-2 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {e.student.fullName} <span className="font-normal text-muted-foreground">· {e.student.email}</span>
                      </p>
                      <p className="text-muted-foreground">{e.course.title}</p>
                    </div>
                    <div className="text-right">
                      <p className={statusTone[e.status]}>{e.status.toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {sourceLabel[e.source]} · {e.expiresAt ? `until ${formatDate(e.expiresAt)}` : "lifetime"}
                      </p>
                    </div>
                  </div>
                  {e.grantReason ? (
                    <p className="text-xs text-muted-foreground">
                      Granted{e.grantedBy ? ` by ${e.grantedBy}` : ""}: {e.grantReason}
                    </p>
                  ) : null}
                  {canChange && e.status !== "PENDING" ? <EnrollmentRowActions id={e.id} status={e.status} /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {canGrant ? (
          <section className="rounded-lg border border-border bg-surface p-6 xl:self-start" aria-labelledby="grant-heading">
            <h2 id="grant-heading" className="font-sans text-lg font-semibold">
              Grant access
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">For scholarships, partner colleges or support cases. No payment is recorded.</p>
            <GrantForm courses={courseOptions} />
          </section>
        ) : null}
      </div>
    </>
  );
}
