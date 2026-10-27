"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { priorityLabel, statusLabel } from "@/components/support/labels";
import { idle } from "@/lib/forms";
import { staffReplyAction, updateTicketAction } from "../../learning-actions";

export function StaffReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(staffReplyAction.bind(null, id), idle);
  return (
    <ActionForm key={state.values?.sent ?? "reply"} action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <TextareaField id="staff-reply" name="body" label="Message" rows={5} maxLength={5000} defaultValue={state.status === "error" ? state.values?.body : undefined} error={state.fieldErrors?.body} hint="The student is emailed a link — the text itself is only shown after they sign in." />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isInternalNote" className="size-4 accent-[var(--primary)]" /> Internal note (staff only, no email)
      </label>
      <SubmitButton className="justify-self-start">Send</SubmitButton>
    </ActionForm>
  );
}

export function TicketSettingsForm({ id, status, priority, assigneeId, staff }: { id: string; status: string; priority: string; assigneeId: string | null; staff: { id: string; fullName: string }[] }) {
  const [state, action, pending] = useActionState(updateTicketAction.bind(null, id), idle);
  return (
    <ActionForm action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <SelectField id="ticket-status" name="status" label="Status" options={Object.entries(statusLabel).map(([value, l]) => ({ value, label: l.staff }))} defaultValue={status} />
      <SelectField id="ticket-priority" name="priority" label="Priority" options={Object.entries(priorityLabel).map(([value, label]) => ({ value, label }))} defaultValue={priority} />
      <SelectField id="ticket-assignee" name="assigneeId" label="Assignee" options={[{ value: "", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.fullName }))]} defaultValue={assigneeId ?? ""} />
      <SubmitButton size="sm" variant="outline" className="justify-self-start">
        Update
      </SubmitButton>
    </ActionForm>
  );
}
