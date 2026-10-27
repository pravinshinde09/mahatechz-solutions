"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { saveOfflineSettingsAction } from "../commerce-actions";

export interface OfflineSettings {
  payeeName: string;
  upiId: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifsc: string;
  notes: string;
}

export function OfflineSettingsForm({ initial }: { initial: OfflineSettings }) {
  const [state, action, pending] = useActionState(saveOfflineSettingsAction, idle);
  const e = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} pending={pending} className="grid gap-5">
      <FormMessage state={state} />
      <Field name="payeeName" label="Payee name" defaultValue={initial.payeeName} error={e.payeeName} hint="As it appears in UPI apps." />
      <Field name="upiId" label="UPI ID" defaultValue={initial.upiId} placeholder="mahatecz@okhdfcbank" className="font-mono" error={e.upiId} />
      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium">Bank transfer</legend>
        <Field name="bankAccountName" label="Account name" defaultValue={initial.bankAccountName} error={e.bankAccountName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="bankAccountNumber" label="Account number" defaultValue={initial.bankAccountNumber} inputMode="numeric" className="font-mono" error={e.bankAccountNumber} />
          <Field name="ifsc" label="IFSC" defaultValue={initial.ifsc} className="font-mono uppercase" maxLength={11} error={e.ifsc} />
        </div>
        <Field name="bankName" label="Bank and branch" defaultValue={initial.bankName} error={e.bankName} />
      </fieldset>
      <TextareaField name="notes" label="Extra instructions (optional)" rows={3} maxLength={1000} defaultValue={initial.notes} error={e.notes} />
      <SubmitButton className="justify-self-start">Save payment details</SubmitButton>
    </ActionForm>
  );
}
