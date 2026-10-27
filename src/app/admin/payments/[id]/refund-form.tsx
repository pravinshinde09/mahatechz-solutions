"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { formatPaise } from "@/lib/format";
import { refundAction } from "../../commerce-actions";

export function RefundForm({ paymentId, refundablePaise, offline }: { paymentId: string; refundablePaise: number; offline: boolean }) {
  const [state, action, pending] = useActionState(refundAction.bind(null, paymentId, offline), idle);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <ActionForm
      action={(form) => {
        // Refunds can't be undone (spec §17.3): confirm with the consequence spelled out.
        const amount = String(form.get("amount") || "").trim();
        if (!window.confirm(`Refund ${amount ? `₹${amount}` : formatPaise(refundablePaise)}? This can't be undone.`)) return;
        action(form);
      }}
      pending={pending}
      className="grid gap-4"
    >
      <p className="text-sm font-medium">Issue a refund</p>
      <FormMessage state={state} />
      <Field name="amount" label="Amount (₹)" inputMode="decimal" placeholder={`Full: ${formatPaise(refundablePaise)}`} error={state.fieldErrors?.amount ?? state.fieldErrors?.amountPaise} hint="Leave empty for a full refund." />
      {offline ? <Field name="manualReference" label="Refund transfer reference" required error={state.fieldErrors?.manualReference} hint="UTR of the transfer you sent back." /> : null}
      <TextareaField name="reason" label="Reason" rows={2} maxLength={500} error={state.fieldErrors?.reason} />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="revokeAccess" defaultChecked className="mt-0.5 size-4 accent-[var(--primary)]" />
        Remove course access after a full refund
      </label>
      <SubmitButton variant="destructive">{offline ? "Record refund" : "Refund via Razorpay"}</SubmitButton>
    </ActionForm>
  );
}
