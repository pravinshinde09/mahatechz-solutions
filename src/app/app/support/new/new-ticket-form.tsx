"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { AttachmentPicker } from "@/components/support/ticket-parts";
import { categoryLabel } from "@/components/support/labels";
import { idle } from "@/lib/forms";
import { createTicketAction } from "../actions";

const categories = Object.entries(categoryLabel).map(([value, label]) => ({ value, label }));

export function NewTicketForm({ courses, defaultCategory }: { courses: { value: string; label: string }[]; defaultCategory?: string | undefined }) {
  const [state, action, pending] = useActionState(createTicketAction, idle);
  const e = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} pending={pending} className="grid gap-5">
      <FormMessage state={state} />
      <SelectField name="category" label="What is it about?" options={categories} defaultValue={state.values?.category ?? defaultCategory ?? "TECHNICAL"} error={e.category} />
      {courses.length ? <SelectField name="relatedCourseId" label="Course (optional)" options={[{ value: "", label: "Not about a specific course" }, ...courses]} defaultValue={state.values?.relatedCourseId} error={e.relatedCourseId} /> : null}
      <Field name="subject" label="Subject" required minLength={5} maxLength={160} defaultValue={state.values?.subject} error={e.subject} />
      <TextareaField name="message" label="Message" rows={6} maxLength={5000} defaultValue={state.values?.message} error={e.message} hint="At least 10 characters. Never share your password." />
      <AttachmentPicker />
      <SubmitButton className="justify-self-start">Send request</SubmitButton>
    </ActionForm>
  );
}
