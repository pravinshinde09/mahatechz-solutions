import { Award, Download, ExternalLink, Share2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CertificateStatus } from "@/components/certificates/certificate-status";
import { CopyButton } from "@/components/certificates/copy-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import type { MyCertificate } from "@/lib/contracts/certification";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Certificates" };

/** LinkedIn's "Add to profile" link (spec FR-CER-07): fields are prefilled, nothing is shared without the student. */
function linkedInUrl(c: MyCertificate) {
  const issued = new Date(c.issuedAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: c.courseTitle,
    organizationName: c.issuer,
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    certUrl: c.verificationUrl,
    certId: c.certificateNumber,
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export default async function CertificatesPage() {
  const res = await authedRequest<MyCertificate[]>("/me/certificates");
  const certificates = res.ok ? res.data : [];
  const current = certificates.filter((c) => c.status !== "SUPERSEDED");
  const replaced = certificates.filter((c) => c.status === "SUPERSEDED");

  return (
    <>
      <PageHeader title="Certificates" description="Download your certificates any time. Anyone with a certificate's verification link can confirm it's genuine — they see only your name, the course and the date." />
      {!res.ok ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {res.error.message}
        </p>
      ) : !current.length ? (
        <EmptyState
          title="No certificates yet"
          description="Complete a course to earn a certificate. Your progress page shows what's left for each course."
          action={
            <Button asChild>
              <Link href="/app/progress">See my progress</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {current.map((c) => (
            <li key={c.id} className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
              {/* A document-style face: the certificate is a paper record, light in both themes. */}
              <div className="relative bg-[#fbfcfe] p-5 text-[#0b1b33]">
                <div className="pointer-events-none absolute inset-2 rounded-sm border-2 border-[#1d6fe8]/80" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-3.5 rounded-sm border border-[#0b1b33]/20" aria-hidden="true" />
                <div className="relative px-3 py-4 text-center">
                  <Award className="mx-auto size-6 text-[#1d6fe8]" aria-hidden="true" />
                  <p className="mt-2 text-xs font-semibold tracking-wide text-[#5b6b82] uppercase">{c.issuer}</p>
                  <p className="mt-3 font-serif text-2xl leading-tight font-bold break-words">{c.recipientName}</p>
                  <p className="mt-2 text-sm text-[#5b6b82]">has completed</p>
                  <p className="mt-1 font-semibold break-words">{c.courseTitle}</p>
                  <p className="mt-3 font-mono text-xs text-[#5b6b82]">{c.certificateNumber}</p>
                </div>
              </div>
              <div className="grid flex-1 gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <CertificateStatus status={c.status} />
                  <span className="text-muted-foreground">
                    {c.status === "REVOKED" && c.revokedAt ? `Revoked ${formatDate(c.revokedAt)}` : `Issued ${formatDate(c.issuedAt)} · completed ${formatDate(`${c.completionDate}T12:00:00Z`)}`}
                  </span>
                </div>
                {c.status === "REVOKED" ? (
                  <p className="text-sm text-muted-foreground">
                    This certificate is no longer valid. If you think this is a mistake,{" "}
                    <Link href="/app/support/new" className="text-primary hover:underline">
                      contact support
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <a href={`/api/certificates/${c.id}/pdf`} target="_blank" rel="noopener">
                        <Download aria-hidden="true" /> {c.pdfReady ? "Download PDF" : "Prepare & download PDF"}
                      </a>
                    </Button>
                    <CopyButton value={c.verificationUrl} label="Copy verification link" />
                    <Button asChild size="sm" variant="outline">
                      <a href={linkedInUrl(c)} target="_blank" rel="noopener noreferrer">
                        <Share2 aria-hidden="true" /> Add to LinkedIn
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/verify/${c.verificationCode}`} target="_blank">
                        Verification page <ExternalLink aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {replaced.length ? (
        <section className="mt-10" aria-labelledby="replaced-heading">
          <h2 id="replaced-heading" className="font-sans text-lg font-semibold">
            Replaced certificates
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Reissued certificates (for example after a name correction) replace these. Their verification pages point to the new one.</p>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
            {replaced.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span>
                  {c.courseTitle} <span className="font-mono text-xs text-muted-foreground">{c.certificateNumber}</span>
                </span>
                <CertificateStatus status="SUPERSEDED" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
