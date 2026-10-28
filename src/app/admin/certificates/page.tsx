import Link from "next/link";
import { CertificateStatus } from "@/components/certificates/certificate-status";
import { EmptyState } from "@/components/feedback/empty-state";
import { apiPage } from "@/lib/api/server";
import type { AdminCertificate } from "@/lib/contracts/certification";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 50;

export default async function IssuedCertificatesPage(props: PageProps<"/admin/certificates">) {
  const raw = await props.searchParams;
  const pick = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string) : undefined);
  const filters = { q: pick("q"), status: pick("status"), courseId: pick("courseId") };
  const page = Math.max(1, Number(pick("page") ?? 1) || 1);
  const query = new URLSearchParams(Object.entries({ ...filters, page: String(page), pageSize: String(PAGE_SIZE) }).filter((e): e is [string, string] => Boolean(e[1])));
  const [result, courses] = await Promise.all([
    apiPage<AdminCertificate, { total: number }>(`/admin/certificates?${query}`, { authed: true }),
    apiPage<{ id: string; title: string }>("/admin/courses?pageSize=100", { authed: true }),
  ]);
  const rows = result?.data ?? [];
  const total = result?.page.total ?? 0;
  const pageHref = (p: number) => `/admin/certificates?${new URLSearchParams(Object.entries({ ...filters, page: String(p) }).filter((e): e is [string, string] => Boolean(e[1])))}`;

  return (
    <>
      <form method="get" className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Number, name or email" aria-label="Search" className="h-10 min-w-48 flex-1 rounded-sm border border-input bg-surface px-3" />
        <select name="courseId" defaultValue={filters.courseId ?? ""} aria-label="Course" className="h-10 max-w-56 rounded-sm border border-input bg-surface px-3">
          <option value="">All courses</option>
          {(courses?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className="h-10 rounded-sm border border-input bg-surface px-3">
          <option value="">All statuses</option>
          <option value="ISSUED">Valid</option>
          <option value="REVOKED">Revoked</option>
          <option value="SUPERSEDED">Replaced</option>
        </select>
        <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-raised">
          Filter
        </button>
      </form>
      {!result ? (
        <p role="alert" className="text-sm text-danger">
          Certificates couldn&apos;t load. Please try again.
        </p>
      ) : rows.length === 0 ? (
        <EmptyState title="No certificates found" description="Issued certificates appear here. Students who finished a course are listed under Ready to issue." />
      ) : (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {rows.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/certificates/${c.id}`} className="font-mono font-medium hover:underline">
                    {c.certificateNumber}
                  </Link>
                  <p>
                    {c.recipientName} <span className="text-muted-foreground">· {c.courseTitle}</span>
                  </p>
                </div>
                <div className="grid justify-items-end gap-1 text-right">
                  <CertificateStatus status={c.status} />
                  <span className="text-xs text-muted-foreground">
                    Issued {formatDate(c.issuedAt)}
                    {c.eligibilityOverridden ? " · override" : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {total > PAGE_SIZE ? (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link href={pageHref(page - 1)} className="text-primary hover:underline">← Newer</Link> : <span />}
              <span className="text-muted-foreground">
                Page {page} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              {page * PAGE_SIZE < total ? <Link href={pageHref(page + 1)} className="text-primary hover:underline">Older →</Link> : <span />}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
