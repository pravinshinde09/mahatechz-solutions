import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import { formatDateTime, formatPaise } from "@/lib/format";
import { CancelSubmission } from "./cancel-submission";

export const metadata: Metadata = { title: "Payments" };

interface Payment {
  id: string;
  method: string;
  providerMethod: string | null;
  status: string;
  amount: { amountPaise: number };
  refundedPaise: number;
  razorpayPaymentId: string | null;
  capturedAt: string | null;
  createdAt: string;
  course: { title: string; slug: string };
  refunds: { id: string; amountPaise: number; status: string; processedAt: string | null }[];
}
interface Submission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  method: string;
  referenceNumber: string;
  claimedAmountPaise: number;
  decisionNote: string | null;
  decidedAt: string | null;
  course: { id: string; title: string };
  createdAt: string;
}

const paymentLabel: Record<string, { text: string; tone: string }> = {
  CAPTURED: { text: "Paid", tone: "text-success" },
  REFUNDED: { text: "Refunded", tone: "text-muted-foreground" },
  PARTIALLY_REFUNDED: { text: "Partly refunded", tone: "text-warning" },
  FAILED: { text: "Failed", tone: "text-danger" },
  AUTHORIZED: { text: "Processing", tone: "text-warning" },
};
const submissionLabel: Record<Submission["status"], { text: string; tone: string }> = {
  PENDING: { text: "Being verified", tone: "text-warning" },
  APPROVED: { text: "Verified — access granted", tone: "text-success" },
  REJECTED: { text: "Not verified", tone: "text-danger" },
  CANCELLED: { text: "Cancelled", tone: "text-muted-foreground" },
};
const methodLabel = (m: string, provider: string | null) =>
  m === "RAZORPAY" ? `Online${provider ? ` · ${provider.toUpperCase()}` : ""}` : m === "OFFLINE_UPI" ? "UPI (offline)" : m === "OFFLINE_BANK_TRANSFER" ? "Bank transfer" : m;

export default async function PaymentsPage(props: PageProps<"/app/payments">) {
  const params = await props.searchParams;
  const [payments, submissions] = await Promise.all([authedRequest<Payment[]>("/me/payments"), authedRequest<Submission[]>("/me/offline-payments")]);
  const paid = payments.ok ? payments.data : [];
  const subs = (submissions.ok ? submissions.data : []).filter((s) => s.status !== "APPROVED"); // approved ones appear as payments

  return (
    <>
      <PageHeader title="Payments" description="Your purchases, receipts and offline payment requests." />
      {params.submitted ? (
        <Alert variant="success" className="mb-6">
          <CircleCheck />
          <AlertDescription>Thanks! We received your payment details and will verify them within one business day.</AlertDescription>
        </Alert>
      ) : null}

      {subs.length ? (
        <section aria-labelledby="offline-heading" className="mb-8">
          <h2 id="offline-heading" className="mb-3 font-sans text-xl font-semibold">
            Offline payment requests
          </h2>
          <ul className="grid gap-3">
            {subs.map((s) => (
              <li key={s.id} className="rounded-md border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.course.title}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {methodLabel(s.method, null)} · {s.referenceNumber} · {formatPaise(s.claimedAmountPaise)} · {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${submissionLabel[s.status].tone}`}>{submissionLabel[s.status].text}</span>
                </div>
                {s.status === "REJECTED" && s.decisionNote ? (
                  <p className="mt-3 text-sm">
                    Reason: {s.decisionNote}{" "}
                    <Link href={`/checkout/${s.course.id}/offline`} className="text-primary underline">
                      Submit again
                    </Link>
                  </p>
                ) : null}
                {s.status === "PENDING" ? <CancelSubmission id={s.id} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {paid.length ? (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-3 font-sans text-xl font-semibold">
            Payment history
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Course
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Method
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paid.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      {p.course.title}
                      {p.razorpayPaymentId ? <span className="block font-mono text-xs text-muted-foreground">{p.razorpayPaymentId}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{methodLabel(p.method, p.providerMethod)}</td>
                    <td className="px-4 py-3 font-mono tabular">
                      {formatPaise(p.amount.amountPaise)}
                      {p.refundedPaise ? <span className="block text-xs text-muted-foreground">−{formatPaise(p.refundedPaise)} refunded</span> : null}
                    </td>
                    <td className={`px-4 py-3 ${paymentLabel[p.status]?.tone ?? ""}`}>{paymentLabel[p.status]?.text ?? p.status}</td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(p.capturedAt ?? p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">GST invoices will be available here once invoicing is enabled.</p>
        </section>
      ) : subs.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="When you buy a course, your receipts appear here."
          action={
            <Button asChild size="lg">
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : null}
    </>
  );
}
