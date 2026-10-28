import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { VerificationResult } from "@/components/certificates/verification-result";
import { apiRequest } from "@/lib/api/server";
import type { Verification } from "@/lib/contracts/certification";

// Spec §16.3, §29.6: no indexing, and no names in the page title (it shows in history and shares).
export const metadata: Metadata = { title: "Certificate verification", robots: { index: false, follow: false } };

export default async function VerifyCodePage(props: PageProps<"/verify/[code]">) {
  const { code } = await props.params;
  const valid = /^[0-9A-Za-z]{10}$/.test(code);
  const result = valid ? await apiRequest<Verification>(`/certificates/verify/${encodeURIComponent(code.toUpperCase())}`) : ({ ok: false, status: 404, error: { code: "NOT_FOUND", message: "" } } as const);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
      <Link href="/verify" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Verify another certificate
      </Link>
      <h1 className="mt-4 mb-6 text-[28px] leading-[34px] font-semibold md:text-4xl md:leading-[44px]">Certificate verification</h1>
      <VerificationResult result={result} />
      <p className="mt-4 font-mono text-xs text-muted-foreground">Code {code.toUpperCase()}</p>
    </div>
  );
}
