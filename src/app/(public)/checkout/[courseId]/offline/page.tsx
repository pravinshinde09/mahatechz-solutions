import { ArrowLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";
import { formatPaise } from "@/lib/format";
import { OfflineForm } from "./offline-form";

export const metadata: Metadata = { title: "Pay by UPI or bank transfer", robots: { index: false } };

interface Instructions {
  payeeName: string;
  upiId: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifsc: string;
  notes: string;
  courseTitle: string;
  amount: { amountPaise: number; currency: string };
  referenceNote: string;
  upiUri: string | null;
  configured: boolean;
}

export default async function OfflinePaymentPage(props: PageProps<"/checkout/[courseId]/offline">) {
  const user = await requireUser();
  const { courseId } = await props.params;
  if (!user.emailVerified) redirect(`/checkout/${courseId}`);
  const res = await authedRequest<Instructions>(`/courses/${encodeURIComponent(courseId)}/offline-payment-instructions`);
  if (!res.ok) {
    if (res.status === 404) notFound();
    redirect(`/checkout/${courseId}`);
  }
  const i = res.data;
  const qr = i.upiUri ? await QRCode.toDataURL(i.upiUri, { margin: 1, width: 220, errorCorrectionLevel: "M" }) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link href={`/checkout/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to checkout
      </Link>
      <h1 className="mt-4 text-[28px] leading-[34px] font-semibold">Pay by UPI or bank transfer</h1>
      <p className="mt-2 text-muted-foreground">{i.courseTitle}</p>

      {!i.configured ? (
        <Alert variant="warning" className="mt-6">
          <Info />
          <AlertTitle>Offline payment isn&apos;t set up yet</AlertTitle>
          <AlertDescription>Please pay online, or contact support for payment details.</AlertDescription>
        </Alert>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="step1" className="rounded-lg border border-border bg-surface p-6">
            <h2 id="step1" className="font-semibold">
              1. Pay <span className="font-mono tabular">{formatPaise(i.amount.amountPaise)}</span>
            </h2>
            {qr ? (
              <div className="mt-4 flex flex-col items-center gap-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data URL */}
                <img src={qr} alt={`UPI QR code to pay ${formatPaise(i.amount.amountPaise)} to ${i.payeeName || i.upiId}`} width={200} height={200} className="rounded-md bg-white p-2" />
                <p className="text-sm text-muted-foreground">Scan with any UPI app — the amount and note are filled in.</p>
              </div>
            ) : null}
            <dl className="mt-5 grid gap-3 text-sm">
              {i.upiId ? <Detail label="UPI ID" value={i.upiId} mono /> : null}
              {i.payeeName ? <Detail label="Payee" value={i.payeeName} /> : null}
              {i.bankAccountNumber ? (
                <>
                  <Detail label="Account name" value={i.bankAccountName} />
                  <Detail label="Account number" value={i.bankAccountNumber} mono />
                  <Detail label="IFSC" value={i.ifsc} mono />
                  {i.bankName ? <Detail label="Bank" value={i.bankName} /> : null}
                </>
              ) : null}
              <Detail label="Remark / note" value={i.referenceNote} mono highlight />
            </dl>
            {i.notes ? <p className="mt-4 text-sm whitespace-pre-line text-muted-foreground">{i.notes}</p> : null}
          </section>

          <section aria-labelledby="step2" className="rounded-lg border border-border bg-surface p-6">
            <h2 id="step2" className="font-semibold">
              2. Tell us about your payment
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">We match it with our bank statement — usually within one business day.</p>
            <OfflineForm courseId={courseId} amountPaise={i.amount.amountPaise} hasUpi={Boolean(i.upiId)} hasBank={Boolean(i.bankAccountNumber)} />
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex flex-wrap justify-between gap-x-4 gap-y-1 ${highlight ? "rounded-md border border-cyan/40 bg-cyan/5 p-2" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} break-all select-all`}>{value}</dd>
    </div>
  );
}
