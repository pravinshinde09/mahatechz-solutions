import { ArrowLeft, Clock, Landmark, MailWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatPaise } from "@/lib/format";
import { FreeEnroll } from "./free-enroll";
import { PayOnline } from "./pay-online";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

interface Quote {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  listPaise: number;
  amount: { amountPaise: number; currency: string };
  promoEndsAt: string | null;
  isFree: boolean;
  accessDurationDays: number | null;
  enrollment: { status: string; expiresAt: string | null } | null;
  pendingOfflineSubmissionId: string | null;
  provider: "razorpay" | "simulated";
}

export default async function CheckoutPage(props: PageProps<"/checkout/[courseId]">) {
  const user = await requireUser();
  const { courseId } = await props.params;
  if (!user.emailVerified) {
    return (
      <Shell>
        <Alert variant="warning">
          <MailWarning />
          <AlertTitle>Verify your email to enrol</AlertTitle>
          <AlertDescription>
            We sent a verification link to <strong>{user.email}</strong>. You can request a new one from your{" "}
            <Link href="/app" className="underline">
              dashboard
            </Link>
            .
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const res = await authedRequest<Quote>("/checkout/quote", { method: "POST", body: { courseId } });
  if (!res.ok) {
    if (res.status === 404) notFound();
    return (
      <Shell>
        <Alert variant="destructive">
          <AlertDescription>{res.error.message}</AlertDescription>
        </Alert>
      </Shell>
    );
  }
  const q = res.data;
  if (q.enrollment?.status === "ACTIVE" && (!q.enrollment.expiresAt || new Date(q.enrollment.expiresAt) > new Date())) redirect("/app/courses");

  const amountLabel = formatPaise(q.amount.amountPaise);
  return (
    <Shell backHref={`/courses/${q.courseSlug}`}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="summary-heading" className="rounded-lg border border-border bg-surface p-6">
          <h2 id="summary-heading" className="text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">
            Order summary
          </h2>
          <p className="mt-3 text-xl leading-7 font-semibold">{q.courseTitle}</p>
          <dl className="mt-5 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Access</dt>
              <dd>{q.accessDurationDays ? `${q.accessDurationDays} days` : "Lifetime"}</dd>
            </div>
            {q.listPaise > q.amount.amountPaise ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Regular price</dt>
                <dd className="font-mono text-muted-foreground line-through tabular">{formatPaise(q.listPaise)}</dd>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between gap-4 border-t border-border pt-3 text-base">
              <dt className="font-medium">Total (incl. GST)</dt>
              <dd className="font-mono text-xl font-semibold tabular">{q.isFree ? "Free" : amountLabel}</dd>
            </div>
            {q.promoEndsAt ? <p className="text-xs text-warning">Offer price until {formatDate(q.promoEndsAt)}</p> : null}
          </dl>
        </section>

        <section aria-labelledby="pay-heading" className="rounded-lg border border-border bg-surface p-6">
          <h2 id="pay-heading" className="text-lg font-semibold">
            {q.isFree ? "Enrol" : "Payment"}
          </h2>
          <div className="mt-4">
            {q.pendingOfflineSubmissionId ? (
              <Alert variant="info">
                <Clock />
                <AlertTitle>Payment under verification</AlertTitle>
                <AlertDescription>
                  We&apos;re checking your offline payment. Track it under{" "}
                  <Link href="/app/payments" className="underline">
                    Payments
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            ) : q.isFree ? (
              <FreeEnroll courseId={q.courseId} />
            ) : (
              <div className="grid gap-6">
                <PayOnline courseId={q.courseId} amountLabel={amountLabel} />
                <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/checkout/${q.courseId}/offline`}>
                    <Landmark /> Pay by UPI or bank transfer
                  </Link>
                </Button>
                <p className="-mt-3 text-center text-xs text-muted-foreground">Access opens after our team verifies the payment (usually within one business day).</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children, backHref = "/courses" }: { children: React.ReactNode; backHref?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to course
      </Link>
      <h1 className="mt-4 mb-6 text-[28px] leading-[34px] font-semibold">Checkout</h1>
      {children}
    </div>
  );
}
