"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { formatPaise, paiseToRupees, rupeesToPaise } from "@/lib/format";
import { approveOfflineAction, rejectOfflineAction } from "../../commerce-actions";

export function DecisionForms({ id, expectedAmountPaise, claimedAmountPaise }: { id: string; expectedAmountPaise: number; claimedAmountPaise: number }) {
  const [approveState, approve, approving] = useActionState(approveOfflineAction.bind(null, id), idle);
  const [rejectState, reject, rejecting] = useActionState(rejectOfflineAction.bind(null, id), idle);
  const [amount, setAmount] = useState(paiseToRupees(claimedAmountPaise));
  const differs = rupeesToPaise(amount) !== expectedAmountPaise;
  const done = approveState.status === "success" || rejectState.status === "success";

  if (done) return <div className="mt-4"><FormMessage state={approveState.status === "success" ? approveState : rejectState} /></div>;

  return (
    <div className="mt-4 grid gap-8">
      <ActionForm action={approve} pending={approving} className="grid gap-4">
        <FormMessage state={approveState} />
        <Field
          id="verified-amount"
          name="verifiedAmount"
          label="Amount received in the statement (₹)"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={approveState.fieldErrors?.verifiedAmount ?? approveState.fieldErrors?.verifiedAmountPaise}
          hint={`Course price: ${formatPaise(expectedAmountPaise)}`}
        />
        {differs ? (
          <label className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
            <input type="checkbox" name="acceptAmountMismatch" className="mt-0.5 size-4 accent-[var(--primary)]" />
            The amount differs from the course price — approve anyway (explain in the note).
          </label>
        ) : null}
        <Field id="approve-note" name="note" label="Note (e.g. where you matched it)" maxLength={1000} placeholder="Matched in HDFC statement, 2 Nov" error={approveState.fieldErrors?.note} />
        <SubmitButton>Approve and grant access</SubmitButton>
      </ActionForm>

      <ActionForm action={reject} pending={rejecting} className="grid gap-4 border-t border-border pt-6">
        <FormMessage state={rejectState} />
        <TextareaField id="reject-reason" name="reason" label="Reason for rejection (sent to the student)" rows={3} maxLength={1000} error={rejectState.fieldErrors?.reason} />
        <SubmitButton variant="outline">Reject</SubmitButton>
      </ActionForm>
    </div>
  );
}
