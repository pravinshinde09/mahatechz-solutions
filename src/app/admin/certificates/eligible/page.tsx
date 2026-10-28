import { CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { BulkIssueForm } from "./bulk-issue-form";

interface Row {
  enrollmentId: string;
  student: { id: string; fullName: string; email: string };
  course: { id: string; title: string };
  completedAt: string;
  completionOverridden: boolean;
  progressPercent: number;
}

export default async function EligiblePage(props: PageProps<"/admin/certificates/eligible">) {
  const user = await requireStaff();
  if (!hasPermission(user, "certificate.issue")) notFound();
  const raw = await props.searchParams;
  const courseId = typeof raw.courseId === "string" && raw.courseId ? raw.courseId : undefined;
  const [result, courses] = await Promise.all([
    apiPage<Row, { total: number }>(`/admin/certificates/eligible?pageSize=100${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ""}`, { authed: true }),
    apiPage<{ id: string; title: string }>("/admin/courses?pageSize=100", { authed: true }),
  ]);
  const rows = result?.data ?? [];
  const issued = Number(raw.issued) || 0;
  const failed = Number(raw.failed) || 0;

  return (
    <>
      {issued ? (
        <Alert variant="success" role="status" className="mb-4">
          <CircleCheck />
          <AlertDescription>
            Issued {issued} certificate{issued === 1 ? "" : "s"}. PDFs are being prepared and students are emailed.
            {failed ? ` ${failed} couldn't be issued — they're still listed below; open the student to see why.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Students who completed a course that awards certificates and don&apos;t have one yet. To issue to someone who hasn&apos;t met the rule, open their student page and use an override with a reason.
      </p>
      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <select name="courseId" defaultValue={courseId ?? ""} aria-label="Course" className="h-10 max-w-72 rounded-sm border border-input bg-surface px-3">
          <option value="">All courses</option>
          {(courses?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-raised">
          Filter
        </button>
      </form>
      {!result ? (
        <p role="alert" className="text-sm text-danger">
          The list couldn&apos;t load. Please try again.
        </p>
      ) : rows.length === 0 ? (
        <EmptyState title="Nobody is waiting for a certificate" description="When students complete a course that awards certificates, they appear here — you're all caught up." />
      ) : (
        <>
          {result.page.total > rows.length ? <p className="mb-3 text-sm text-muted-foreground">Showing the first {rows.length} of {result.page.total}. Issue these, and the rest will follow.</p> : null}
          <BulkIssueForm key={rows.map((r) => r.enrollmentId).join()} rows={rows} />
        </>
      )}
    </>
  );
}
