import { BadgeCheck, Ban, Replace, SearchX } from "lucide-react";
import Link from "next/link";
import type { ApiResult } from "@/lib/api/server";
import type { Verification } from "@/lib/contracts/certification";
import { formatDate } from "@/lib/format";

const day = (isoDate: string) => formatDate(`${isoDate}T12:00:00Z`);

/** Spec §16.3: status badge plus the minimal fields — nothing else about the person. */
export function VerificationResult({ result }: { result: ApiResult<Verification> }) {
  if (!result.ok) {
    const limited = result.error.code === "RATE_LIMITED";
    return (
      <section role="status" className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">{limited ? "Too many lookups" : "No certificate found"}</h2>
        <p className="mt-2 text-muted-foreground">
          {limited ? "Please wait a minute and try again." : "Check the code or number for typos. Codes are 10 letters and digits; numbers look like MZT-ACE-2027-000042."}
        </p>
      </section>
    );
  }
  const v = result.data;
  const state = {
    VALID: { icon: BadgeCheck, title: "Valid certificate", tone: "text-success border-success/40 bg-success/10" },
    REVOKED: { icon: Ban, title: `Revoked${v.revokedOn ? ` on ${day(v.revokedOn)}` : ""}`, tone: "text-danger border-danger/40 bg-danger/10" },
    SUPERSEDED: { icon: Replace, title: "Superseded by a reissued certificate", tone: "text-warning border-warning/40 bg-warning/10" },
  }[v.status];
  return (
    <section aria-labelledby="verify-result" className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className={`flex items-center gap-3 border-b px-6 py-4 ${state.tone}`}>
        <state.icon className="size-6 shrink-0" aria-hidden="true" />
        <h2 id="verify-result" className="font-sans text-lg font-semibold">
          {state.title}
        </h2>
      </div>
      <dl className="grid gap-5 p-6 sm:grid-cols-2 md:p-8">
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Awarded to</dt>
          <dd className="mt-1 font-serif text-2xl font-bold break-words">{v.recipientName}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Course</dt>
          <dd className="mt-1 font-semibold break-words">{v.courseTitle}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Issued on</dt>
          <dd className="mt-1">{day(v.issuedOn)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Issued by</dt>
          <dd className="mt-1">{v.issuer}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Certificate number</dt>
          <dd className="mt-1 font-mono text-sm break-all">{v.certificateNumber}</dd>
        </div>
      </dl>
      {v.replacedByCode ? (
        <p className="border-t border-border px-6 py-4 text-sm md:px-8">
          <Link href={`/verify/${v.replacedByCode}`} className="font-medium text-primary hover:underline">
            View the reissued certificate →
          </Link>
        </p>
      ) : null}
      <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground md:px-8">
        This confirms completion of a course on Mahatecz Learning. It is not a certification by any software vendor.
      </p>
    </section>
  );
}
