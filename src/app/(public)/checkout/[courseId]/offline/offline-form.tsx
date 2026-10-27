"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Uploader, type UploadActions } from "@/components/media/uploader";
import type { MediaAsset } from "@/lib/contracts/media";
import { idle } from "@/lib/forms";
import { paiseToRupees, toIstInput } from "@/lib/format";
import { completeProofUploadAction, startProofUploadAction, submitOfflinePaymentAction } from "../../actions";

const proofActions: UploadActions = { start: startProofUploadAction, complete: completeProofUploadAction };

export function OfflineForm({ courseId, amountPaise, hasUpi, hasBank }: { courseId: string; amountPaise: number; hasUpi: boolean; hasBank: boolean }) {
  // One key per visit so a double submit can't create two requests (spec §20.1).
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(submitOfflinePaymentAction.bind(null, courseId, idempotencyKey), idle);
  const [proof, setProof] = useState<MediaAsset | null>(null);
  const [now] = useState(() => toIstInput(new Date().toISOString()));
  const errors = state.fieldErrors ?? {};
  const methods = [...(hasUpi ? [{ value: "OFFLINE_UPI", label: "UPI" }] : []), ...(hasBank ? [{ value: "OFFLINE_BANK_TRANSFER", label: "Bank transfer (NEFT / IMPS / RTGS)" }] : [])];

  return (
    <ActionForm action={action} pending={pending} className="grid gap-5">
      <FormMessage state={state} />
      <SelectField name="method" label="How did you pay?" options={methods} error={errors.method} />
      <Field
        name="referenceNumber"
        label="Transaction reference (UTR)"
        required
        minLength={6}
        maxLength={64}
        autoComplete="off"
        className="font-mono"
        error={errors.referenceNumber}
        hint="The 12-digit UPI reference or bank UTR shown in your payment app or bank statement."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="amount" label="Amount paid (₹)" inputMode="decimal" required defaultValue={paiseToRupees(amountPaise)} error={errors.amount ?? errors.claimedAmountPaise} />
        <Field name="paidAt" label="Paid on (IST)" type="datetime-local" required defaultValue={now} max={now} error={errors.paidAt} />
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium">Payment screenshot (optional, speeds up verification)</p>
        <input type="hidden" name="proofAssetId" value={proof?.id ?? ""} />
        {proof ? <p className="text-sm text-success">Attached: {proof.originalFilename}</p> : <Uploader purpose="PAYMENT_PROOF" label="Upload screenshot or receipt" actions={proofActions} onUploaded={setProof} />}
      </div>
      <SubmitButton className="w-full">Submit for verification</SubmitButton>
      <p className="text-xs text-muted-foreground">Submitting a reference that wasn&apos;t paid to us delays access and may lead to account suspension.</p>
    </ActionForm>
  );
}
