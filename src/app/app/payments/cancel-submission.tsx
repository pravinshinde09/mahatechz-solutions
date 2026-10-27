"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelOfflinePaymentAction } from "@/app/(public)/checkout/actions";

export function CancelSubmission({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-3 flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Cancel this payment request? Do this only if you entered the wrong details or didn't pay.")) return;
          startTransition(async () => {
            const result = await cancelOfflinePaymentAction(id);
            setError(result.status === "error" ? (result.message ?? "Couldn't cancel.") : null);
          });
        }}
      >
        Cancel request
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
