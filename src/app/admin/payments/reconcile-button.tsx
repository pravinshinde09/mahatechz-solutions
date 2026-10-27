"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { reconcileAction } from "../commerce-actions";

/** Runs the reconciliation job now (it also runs every 15 minutes in the worker). */
export function ReconcileButton() {
  const [state, action] = useActionState(reconcileAction, idle);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <SubmitButton variant="outline" size="default">
        <RefreshCw /> Reconcile with Razorpay
      </SubmitButton>
      {state.message ? (
        <p className={`text-xs ${state.status === "error" ? "text-danger" : "text-muted-foreground"}`} aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
