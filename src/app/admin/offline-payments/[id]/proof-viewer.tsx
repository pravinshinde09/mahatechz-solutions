"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { proofUrlAction } from "../../commerce-actions";

/** Loads a short-lived signed URL only when the admin asks to see the proof (spec §22.3 proof viewer). */
export function ProofViewer({ submissionId }: { submissionId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  if (url) {
    const pdf = /\.pdf(\?|$)/i.test(url) || url.includes("type=application%2Fpdf");
    return pdf ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
        Open PDF receipt
      </a>
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer" title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived private URL */}
        <img src={url} alt="Payment screenshot submitted by the student" className="max-h-[480px] w-full rounded-md border border-border object-contain" />
      </a>
    );
  }
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const signed = await proofUrlAction(submissionId);
            if (signed) setUrl(signed);
            else setError(true);
          })
        }
      >
        Show payment screenshot
      </Button>
      {error ? <p className="text-sm text-danger">Couldn&apos;t load the screenshot.</p> : null}
    </div>
  );
}
