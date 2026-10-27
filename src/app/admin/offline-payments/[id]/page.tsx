import { ArrowLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPaise } from "@/lib/format";
import type { AdminSubmission } from "../page";
import { DecisionForms } from "./decision-forms";
import { ProofViewer } from "./proof-viewer";

export const metadata: Metadata = { title: "Verify offline payment" };

export default async function OfflinePaymentDetailPage(props: PageProps<"/admin/offline-payments/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "payment.read.details")) notFound();
  const { id } = await props.params;
  const res = await authedRequest<AdminSubmission>(`/admin/offline-payments/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  const s = res.data;

  return (
    <>
      <Link href="/admin/offline-payments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Offline payments
      </Link>
      <h1 className="mt-3 mb-6 text-[28px] leading-[34px] font-semibold">Verify payment</h1>
      {s.duplicateReferences.length ? (
        <Alert variant="destructive" className="mb-6">
          <TriangleAlert />
          <AlertTitle>This reference was submitted before</AlertTitle>
          <AlertDescription>
            <ul>
              {s.duplicateReferences.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/offline-payments/${d.id}`} className="underline">
                    {d.studentEmail}
                  </Link>{" "}
                  — {d.status.toLowerCase()} on {formatDateTime(d.createdAt)}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="claim-heading">
          <h2 id="claim-heading" className="font-sans text-lg font-semibold">
            What the student says
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Student" value={`${s.student.fullName} · ${s.student.email}${s.student.phone ? ` · ${s.student.phone}` : ""}`} />
            <Row label="Course" value={s.course.title} />
            <Row label="Method" value={s.method === "OFFLINE_UPI" ? "UPI" : "Bank transfer"} />
            <Row label="Reference (UTR)" value={s.referenceNumber} mono />
            <Row label="Paid on" value={formatDateTime(s.paidAt)} />
            <Row label="Amount claimed" value={formatPaise(s.claimedAmountPaise)} mono />
            <Row label="Course price" value={formatPaise(s.expectedAmountPaise)} mono />
            <Row label="Submitted" value={formatDateTime(s.createdAt)} />
          </dl>
          <div className="mt-6">{s.hasProof ? <ProofViewer submissionId={s.id} /> : <p className="text-sm text-muted-foreground">No screenshot attached.</p>}</div>
        </section>
        <section className="rounded-lg border border-border bg-surface p-6 lg:self-start" aria-labelledby="decision-heading">
          <h2 id="decision-heading" className="font-sans text-lg font-semibold">
            Decision
          </h2>
          {s.status === "PENDING" ? (
            hasPermission(user, "payment.offline.approve") ? (
              <DecisionForms id={s.id} expectedAmountPaise={s.expectedAmountPaise} claimedAmountPaise={s.claimedAmountPaise} />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">You can view this request but not approve it.</p>
            )
          ) : (
            <dl className="mt-4 grid gap-3 text-sm">
              <Row label="Status" value={s.status.toLowerCase()} />
              {s.verifiedAmountPaise ? <Row label="Verified amount" value={formatPaise(s.verifiedAmountPaise)} mono /> : null}
              {s.decidedBy ? <Row label="Decided by" value={s.decidedBy} /> : null}
              {s.decidedAt ? <Row label="Decided on" value={formatDateTime(s.decidedAt)} /> : null}
              {s.decisionNote ? <Row label="Note" value={s.decisionNote} /> : null}
            </dl>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono tabular" : ""} break-words`}>{value}</dd>
    </div>
  );
}
