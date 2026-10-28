import { CircleCheck, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateStatus } from "@/components/certificates/certificate-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { AdminCertificate } from "@/lib/contracts/certification";
import { formatDate, formatDateTime } from "@/lib/format";
import { ReissueForm, RevokeForm } from "./certificate-forms";

const eventLabel: Record<string, string> = { ISSUED: "Issued", REVOKED: "Revoked", REISSUED: "Replaced by a reissue", PDF_REGENERATED: "PDF regenerated", OVERRIDE: "Eligibility overridden" };

export default async function CertificatePage(props: PageProps<"/admin/certificates/[id]">) {
  const user = await requireStaff();
  const { id } = await props.params;
  const search = await props.searchParams;
  const res = await authedRequest<AdminCertificate>(`/admin/certificates/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  const c = res.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid content-start gap-6">
        {search.reissued ? (
          <Alert variant="success" role="status">
            <CircleCheck />
            <AlertDescription>Reissued. The previous certificate now shows as replaced and points here. The new PDF is being prepared.</AlertDescription>
          </Alert>
        ) : null}
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-semibold">{c.certificateNumber}</p>
              <p className="mt-1 text-sm text-muted-foreground">Verification code {c.verificationCode}</p>
            </div>
            <CertificateStatus status={c.status} />
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Printed name</dt>
              <dd className="font-medium">{c.recipientName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Student</dt>
              <dd>
                {hasPermission(user, "progress.read") ? (
                  <Link href={`/admin/students/${c.student.id}`} className="text-primary hover:underline">
                    {c.student.fullName}
                  </Link>
                ) : (
                  c.student.fullName
                )}{" "}
                <span className="text-muted-foreground">· {c.student.email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Course</dt>
              <dd>{c.courseTitle}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Completed · issued</dt>
              <dd>
                {formatDate(`${c.completionDate}T12:00:00Z`)} · {formatDate(c.issuedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Issued by</dt>
              <dd>{c.issuedBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Eligibility</dt>
              <dd>{c.eligibilityOverridden ? <span className="text-warning">Overridden by an admin</span> : "Met the completion rule"}</dd>
            </div>
            {c.revokedAt ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Revoked {formatDate(c.revokedAt)} — internal reason</dt>
                <dd>{c.revokeReason}</dd>
              </div>
            ) : null}
            {c.supersededBy ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Replaced by</dt>
                <dd>
                  <Link href={`/admin/certificates/${c.supersededBy.id}`} className="font-mono text-primary hover:underline">
                    {c.supersededBy.certificateNumber}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {c.status !== "REVOKED" ? (
              <Button asChild size="sm">
                <a href={`/api/admin/certificates/${c.id}/pdf`} target="_blank" rel="noopener">
                  <Download aria-hidden="true" /> {c.pdfReady ? "Download PDF" : "Generate & download PDF"}
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/verify/${c.verificationCode}`} target="_blank">
                Public verification page <ExternalLink aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="history-heading" className="rounded-lg border border-border bg-surface p-6">
          <h2 id="history-heading" className="font-sans text-base font-semibold">
            History
          </h2>
          <ol className="mt-3 grid gap-3 text-sm">
            {c.events.map((e, i) => (
              <li key={i} className="border-l-2 border-border pl-3">
                <p>
                  <span className="font-medium">{eventLabel[e.type] ?? e.type}</span> <span className="text-muted-foreground">· {formatDateTime(e.createdAt)}{e.actor ? ` · ${e.actor}` : e.type === "ISSUED" ? " · system" : ""}</span>
                </p>
                {e.reason ? <p className="text-muted-foreground">{e.reason}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {c.status === "ISSUED" && (hasPermission(user, "certificate.issue") || hasPermission(user, "certificate.revoke")) ? (
        <aside className="grid content-start gap-6">
          {hasPermission(user, "certificate.issue") ? (
            <section aria-labelledby="reissue-heading" className="rounded-lg border border-border bg-surface p-5">
              <h2 id="reissue-heading" className="font-sans text-base font-semibold">
                Reissue
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">For name corrections. Keeps the original completion date; gets a new number and code.</p>
              <ReissueForm id={c.id} currentName={c.recipientName} />
            </section>
          ) : null}
          {hasPermission(user, "certificate.revoke") ? (
            <section aria-labelledby="revoke-heading" className="rounded-lg border border-danger/30 bg-surface p-5">
              <h2 id="revoke-heading" className="font-sans text-base font-semibold">
                Revoke
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">The student is notified; the public page shows &ldquo;Revoked&rdquo; with the date only.</p>
              <RevokeForm id={c.id} />
            </section>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
