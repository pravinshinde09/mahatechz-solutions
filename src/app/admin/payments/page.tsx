import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPaise } from "@/lib/format";
import { ReconcileButton } from "./reconcile-button";

export const metadata: Metadata = { title: "Payments" };

export interface AdminPayment {
  id: string;
  method: string;
  providerMethod: string | null;
  status: string;
  amount: { amountPaise: number; currency: string };
  refundedPaise: number;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  reviewFlag: string | null;
  failureReason: string | null;
  capturedAt: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string };
  student: { id: string; fullName: string; email: string };
  offlineSubmissionId: string | null;
  verifiedBy: string | null;
  refunds: { id: string; amountPaise: number; status: string; reason: string; manualReference: string | null; razorpayRefundId: string | null; processedAt: string | null; createdAt: string }[];
}

const statusTone: Record<string, string> = { CAPTURED: "text-success", FAILED: "text-danger", REFUNDED: "text-muted-foreground", PARTIALLY_REFUNDED: "text-warning", AUTHORIZED: "text-warning" };
export const flagLabel: Record<string, string> = { DUPLICATE_PURCHASE: "Duplicate purchase — refund", AMOUNT_MISMATCH: "Amount mismatch", DISPUTED: "Disputed (chargeback)" };

export default async function AdminPaymentsPage(props: PageProps<"/admin/payments">) {
  const user = await requireStaff();
  if (!hasPermission(user, "payment.read.details")) notFound();
  const raw = await props.searchParams;
  const pick = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string) : undefined);
  const filters = { status: pick("status"), method: pick("method"), flagged: pick("flagged"), q: pick("q"), page: pick("page") ?? "1" };
  const query = new URLSearchParams(Object.entries({ ...filters, pageSize: "25" }).filter((e): e is [string, string] => Boolean(e[1])));
  const result = await apiPage<AdminPayment, { page: number; total: number }>(`/admin/payments?${query}`, { authed: true });
  const rows = result?.data ?? [];

  return (
    <>
      <PageHeader title="Payments" description="Online and approved offline payments. Revenue counts captured payments only." actions={hasPermission(user, "payment.refund") ? <ReconcileButton /> : null} />
      <form method="get" className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Student, email or pay_ id" aria-label="Search" className="h-10 min-w-56 flex-1 rounded-sm border border-input bg-surface px-3" />
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className="h-10 rounded-sm border border-input bg-surface px-3">
          <option value="">All statuses</option>
          {["CAPTURED", "FAILED", "AUTHORIZED", "REFUNDED", "PARTIALLY_REFUNDED"].map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select name="method" defaultValue={filters.method ?? ""} aria-label="Method" className="h-10 rounded-sm border border-input bg-surface px-3">
          <option value="">All methods</option>
          <option value="RAZORPAY">Online (Razorpay)</option>
          <option value="OFFLINE_UPI">Offline UPI</option>
          <option value="OFFLINE_BANK_TRANSFER">Bank transfer</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="flagged" value="true" defaultChecked={filters.flagged === "true"} className="size-4 accent-[var(--primary)]" /> Needs attention
        </label>
        <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-raised">
          Filter
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No payments match" description="Payments appear here once students pay online or an offline payment is approved." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
              <tr>
                {["Student", "Course", "Amount", "Status", "Method", "Date"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface-raised/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/payments/${p.id}`} className="font-medium hover:text-primary">
                      {p.student.fullName}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{p.student.email}</span>
                  </td>
                  <td className="px-4 py-3">{p.course.title}</td>
                  <td className="px-4 py-3 font-mono tabular">
                    {formatPaise(p.amount.amountPaise)}
                    {p.refundedPaise ? <span className="block text-xs text-muted-foreground">−{formatPaise(p.refundedPaise)}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusTone[p.status] ?? ""}>{p.status.replace("_", " ").toLowerCase()}</span>
                    {p.reviewFlag ? (
                      <span className="mt-1 flex items-center gap-1 text-xs text-warning">
                        <TriangleAlert className="size-3.5" aria-hidden="true" /> {flagLabel[p.reviewFlag] ?? p.reviewFlag}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.method === "RAZORPAY" ? `Razorpay${p.providerMethod ? ` · ${p.providerMethod}` : ""}` : p.method.replace("OFFLINE_", "offline ").toLowerCase()}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(p.capturedAt ?? p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && result.page.total > 25 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing page {result.page.page} of {Math.ceil(result.page.total / 25)}.{" "}
          {result.page.page * 25 < result.page.total ? (
            <Link href={`/admin/payments?${new URLSearchParams({ ...Object.fromEntries(query), page: String(result.page.page + 1) })}`} className="text-primary underline">
              Next page
            </Link>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
