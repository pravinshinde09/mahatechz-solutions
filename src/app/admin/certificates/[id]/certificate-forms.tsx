"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { reissueCertificateAction, revokeCertificateAction } from "../../completion-actions";

export function RevokeForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revokeCertificateAction.bind(null, id), idle);
  return (
    <ActionForm
      action={(form) => {
        if (!window.confirm("Revoke this certificate? Its verification page will show it as revoked. This can't be undone — a new certificate would need to be issued.")) return;
        action(form);
      }}
      pending={pending}
      className="grid gap-3"
    >
      <FormMessage state={state} />
      <TextareaField id="revoke-reason" name="reason" label="Reason (internal — never shown publicly)" rows={2} defaultValue={state.values?.reason} error={state.fieldErrors?.reason} />
      <SubmitButton size="sm" variant="destructive" className="justify-self-start">
        Revoke certificate
      </SubmitButton>
    </ActionForm>
  );
}

/** Spec §16.4: name corrections become a new certificate; this one is marked superseded and points to it. */
export function ReissueForm({ id, currentName }: { id: string; currentName: string }) {
  const [state, action, pending] = useActionState(reissueCertificateAction.bind(null, id), idle);
  return (
    <ActionForm action={action} pending={pending} className="grid gap-3">
      <FormMessage state={state} />
      <Field id="reissue-name" name="recipientName" label="Name as it should be printed" defaultValue={state.values?.recipientName ?? currentName} error={state.fieldErrors?.recipientName} hint="Latin letters only for now. Leave as is to reprint with the same name." />
      <TextareaField id="reissue-reason" name="reason" label="Reason (at least 10 characters)" rows={2} defaultValue={state.values?.reason} error={state.fieldErrors?.reason} />
      <SubmitButton size="sm" className="justify-self-start">
        Reissue with a new number
      </SubmitButton>
    </ActionForm>
  );
}
