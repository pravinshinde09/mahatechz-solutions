"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { AttachmentPicker } from "@/components/support/ticket-parts";
import { idle } from "@/lib/forms";
import { replyTicketAction } from "../actions";

export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(replyTicketAction.bind(null, id), idle);
  // A fresh form after each sent message (clears the text and attachments).
  return (
    <ActionForm key={state.values?.sent ?? "reply"} action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <TextareaField id="reply-body" name="body" label="Message" rows={4} maxLength={5000} defaultValue={state.status === "error" ? state.values?.body : undefined} error={state.fieldErrors?.body} />
      <AttachmentPicker />
      <SubmitButton className="justify-self-start">Send</SubmitButton>
    </ActionForm>
  );
}
