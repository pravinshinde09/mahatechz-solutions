import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPaise } from "@/lib/format";
import { flagLabel, type AdminPayment } from "../page";
import { RefundForm } from "./refund-form";

export const metadata: Metadata = { title: "Payment" };

export default async function PaymentDetailPage(props: PageProps<"/admin/payments/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "payment.read.details")) notFound();
  const { id } = await props.params;
  const res = await authedRequest<AdminPayment>(`/admin/payments/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  const p = res.data;
  const pendingRefunds = p.refunds.filter((r) => r.status === "PENDING").reduce((n, r) => n + r.amountPaise, 0);
  const refundable = p.amount.amountPaise - p.refundedPaise - pendingRefunds;
  const canRefund = hasPermission(user, "payment.refund") && ["CAPTURED", "PARTIALLY_REFUNDED"].includes(p.status) && refundable > 0;

  return (
    <>
      <Link href="/admin/payments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Payments
      </Link>
      <h1 className="mt-3 mb-6 text-[28px] leading-[34px] font-semibold">
        <span className="font-mono tabular">{formatPaise(p.amount.amountPaise)}</span> · {p.student.fullName}
      </h1>
      {p.reviewFlag ? (
        <Alert variant="warning" className="mb-6">
          <TriangleAlert />
          <AlertDescription>{flagLabel[p.reviewFlag] ?? p.reviewFlag}. Review it and refund if appropriate.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-surface p-6">
          <dl className="grid gap-3 text-sm">
            <Row label="Status" value={p.status.replace("_", " ").toLowerCase()} />
            <Row label="Student" value={`${p.student.fullName} · ${p.student.email}`} />
            <Row label="Course" value={p.course.title} />
            <Row label="Method" value={p.method === "RAZORPAY" ? `Razorpay${p.providerMethod ? ` (${p.providerMethod})` : ""}` : p.method.replace("OFFLINE_", "Offline ").replace("_", " ").toLowerCase()} />
            {p.razorpayPaymentId ? <Row label="Razorpay payment" value={p.razorpayPaymentId} mono /> : null}
            {p.razorpayOrderId ? <Row label="Razorpay order" value={p.razorpayOrderId} mono /> : null}
            {p.verifiedBy ? <Row label="Verified by" value={p.verifiedBy} /> : null}
            {p.failureReason ? <Row label="Failure" value={p.failureReason} /> : null}
            <Row label="Captured" value={p.capturedAt ? formatDateTime(p.capturedAt) : "—"} />
            <Row label="Refunded" value={formatPaise(p.refundedPaise)} mono />
          </dl>
          {p.offlineSubmissionId ? (
            <Link href={`/admin/offline-payments/${p.offlineSubmissionId}`} className="mt-4 inline-block text-sm text-primary underline">
              View the offline submission
            </Link>
          ) : null}
        </section>
        <section className="rounded-lg border border-border bg-surface p-6 lg:self-start">
          <h2 className="font-sans text-lg font-semibold">Refunds</h2>
          {p.refunds.length ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {p.refunds.map((r) => (
                <li key={r.id} className="py-2">
                  <span className="font-mono tabular">{formatPaise(r.amountPaise)}</span> · {r.status.toLowerCase()} · {formatDateTime(r.processedAt ?? r.createdAt)}
                  <span className="block text-xs text-muted-foreground">
                    {r.reason}
                    {r.manualReference ? ` · ref ${r.manualReference}` : ""}
                    {r.razorpayRefundId ? ` · ${r.razorpayRefundId}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No refunds.</p>
          )}
          {canRefund ? (
            <div className="mt-6 border-t border-border pt-6">
              <RefundForm paymentId={p.id} refundablePaise={refundable} offline={p.method !== "RAZORPAY"} />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} break-all`}>{value}</dd>
    </div>
  );
}
