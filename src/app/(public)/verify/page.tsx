import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerificationResult } from "@/components/certificates/verification-result";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/server";
import type { Verification } from "@/lib/contracts/certification";

// Spec §16.3, §29.6: verification pages are never indexed.
export const metadata: Metadata = { title: "Verify a certificate", robots: { index: false, follow: false } };

const CODE = /^[0-9A-Za-z]{10}$/;
const NUMBER = /^MZT-[A-Z0-9]{2,8}-\d{4}-\d{6}$/i;

export default async function VerifyPage(props: PageProps<"/verify">) {
  const search = await props.searchParams;
  const q = typeof search.q === "string" ? search.q.trim() : "";
  if (CODE.test(q)) redirect(`/verify/${q.toUpperCase()}`);
  const byNumber = NUMBER.test(q) ? await apiRequest<Verification>(`/certificates/verify?number=${encodeURIComponent(q.toUpperCase())}`) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader title="Verify a certificate" description="Enter the verification code or certificate number printed on the certificate, or scan its QR code." />
      <form method="get" className="mb-8 flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="verify-q" className="sr-only">
          Verification code or certificate number
        </label>
        <input
          id="verify-q"
          name="q"
          defaultValue={q}
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="7K2M9QX4TB or MZT-ACE-2027-000042"
          className="h-11 min-w-0 flex-1 rounded-sm border border-input bg-surface px-3 font-mono uppercase"
        />
        <Button type="submit" size="lg">
          <ShieldCheck aria-hidden="true" /> Verify
        </Button>
      </form>
      {q && !byNumber ? <p className="text-sm text-danger">That doesn&apos;t look like a verification code (10 letters and digits) or a certificate number.</p> : null}
      {byNumber ? <VerificationResult result={byNumber} /> : null}
    </div>
  );
}
