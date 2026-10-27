"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { levelLabel } from "@/lib/format";
import { createCourseAction } from "../actions";

export type CategoryOption = { id: string; label: string };

export function NewCourseForm({ categories }: { categories: CategoryOption[] }) {
  const [state, action] = useActionState(createCourseAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <Field name="title" label="Course title" required minLength={5} maxLength={120} defaultValue={state.values?.title} error={state.fieldErrors?.title} hint="5–120 characters. The web address is generated from it." />
      <SelectField name="categoryId" label="Category" error={state.fieldErrors?.categoryId} options={categories.map((c) => ({ value: c.id, label: c.label }))} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField name="level" label="Level" options={Object.entries(levelLabel).map(([value, label]) => ({ value, label }))} />
        <SelectField name="language" label="Language" options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "mr", label: "Marathi" }]} />
      </div>
      <Field name="price" label="Price (₹)" inputMode="decimal" required placeholder="4999" defaultValue="0" error={state.fieldErrors?.price ?? state.fieldErrors?.pricePaise} hint="0 makes the course free. Prices include GST." />
      <SubmitButton className="justify-self-start">Create draft</SubmitButton>
    </form>
  );
}
