import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Offline payments" };

export interface AdminSubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  method: string;
  referenceNumber: string;
  paidAt: string;
  claimedAmountPaise: number;
  expectedAmountPaise: number;
  verifiedAmountPaise: number | null;
  decisionNote: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  hasProof: boolean;
  course: { id: string; title: string };
  student: { id: string; fullName: string; email: string; phone: string | null };
  duplicateReferences: { id: string; status: string; studentEmail: string; createdAt: string }[];
  createdAt: string;
}

const tabs = [
  ["PENDING", "To verify"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
  ["CANCELLED", "Cancelled"],
] as const;

const age = (iso: string) => {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return hours < 1 ? "just now" : hours < 48 ? `${hours} h ago` : `${Math.floor(hours / 24)} days ago`;
};

export default async function OfflinePaymentsPage(props: PageProps<"/admin/offline-payments">) {
  const user = await requireStaff();
  if (!hasPermission(user, "payment.read.details")) notFound();
  const params = await props.searchParams;
  const status = tabs.some(([s]) => s === params.status) ? (params.status as string) : "PENDING";
  const result = await apiPage<AdminSubmission, { total: number }>(`/admin/offline-payments?status=${status}&pageSize=50`, { authed: true });
  const rows = result?.data ?? [];

  return (
    <>
      <PageHeader title="Offline payments" description="Match each request with your bank or UPI statement before approving. Pending requests are oldest first." />
      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/offline-payments?status=${value}`}
            aria-current={status === value ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm ${status === value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState title={status === "PENDING" ? "You're all caught up" : "Nothing here"} description={status === "PENDING" ? "No offline payments are waiting for verification." : "No requests with this status."} />
      ) : (
        <ul className="grid gap-3">
          {rows.map((s) => {
            const mismatch = s.claimedAmountPaise !== s.expectedAmountPaise;
            return (
              <li key={s.id}>
                <Link href={`/admin/offline-payments/${s.id}`} className="block rounded-md border border-border bg-surface p-4 hover:border-primary/40 hover:bg-surface-raised">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{s.student.fullName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {s.student.email} · {s.course.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold tabular">{formatPaise(s.claimedAmountPaise)}</p>
                      <p className="text-xs text-muted-foreground">{status === "PENDING" ? age(s.createdAt) : formatDateTime(s.decidedAt ?? s.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono">{s.referenceNumber}</span>
                    <span className="text-muted-foreground">{s.method === "OFFLINE_UPI" ? "UPI" : "Bank transfer"}</span>
                    {s.hasProof ? <span className="text-muted-foreground">· screenshot attached</span> : null}
                    {mismatch ? (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <TriangleAlert className="size-3.5" aria-hidden="true" /> differs from price {formatPaise(s.expectedAmountPaise)}
                      </span>
                    ) : null}
                    {s.duplicateReferences.length ? (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <TriangleAlert className="size-3.5" aria-hidden="true" /> reference used before
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
