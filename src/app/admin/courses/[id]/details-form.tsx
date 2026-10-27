"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { idle } from "@/lib/forms";
import { levelLabel } from "@/lib/format";
import { updateDetailsAction } from "../actions";

export function DetailsForm({
  course,
  categories,
  softwareTags,
}: {
  course: AdminCourse;
  categories: { value: string; label: string }[];
  softwareTags: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(updateDetailsAction.bind(null, course.id), idle);
  const selectedTags = new Set(course.tags.map((t) => t.id));
  const faq = course.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
  return (
    <ActionForm action={action} pending={pending} className="grid gap-6">
      <FormMessage state={state} />
      <Field name="title" label="Title" required maxLength={120} defaultValue={course.title} error={state.fieldErrors?.title} />
      {course.slugLocked ? (
        <Field name="slugDisplay" label="Web address" value={`/courses/${course.slug}`} readOnly disabled hint="The address of a published course can't change." />
      ) : (
        <Field name="slug" label="Web address" defaultValue={course.slug} error={state.fieldErrors?.slug} hint="Lowercase letters, numbers and hyphens. Locked once published." className="font-mono" />
      )}
      <Field name="subtitle" label="Short description" maxLength={200} defaultValue={course.subtitle ?? ""} error={state.fieldErrors?.subtitle} hint="One sentence shown under the title (up to 200 characters)." />
      <SelectField name="categoryId" label="Category" options={categories} defaultValue={course.categoryId} error={state.fieldErrors?.categoryId} />
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField name="level" label="Level" defaultValue={course.level} options={Object.entries(levelLabel).map(([value, label]) => ({ value, label }))} />
        <SelectField name="language" label="Language" defaultValue={course.language} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }, { value: "mr", label: "Marathi" }]} />
      </div>
      <TextareaField
        name="description"
        label="Full description"
        rows={10}
        maxLength={20_000}
        defaultValue={course.description ?? ""}
        error={state.fieldErrors?.description}
        hint={
          <>
            Markdown: <code className="font-mono">## Heading</code>, <code className="font-mono">**bold**</code>, <code className="font-mono">- list</code>,{" "}
            <code className="font-mono">[link](https://…)</code>. HTML is removed.
          </>
        }
      />
      <div className="grid gap-5 md:grid-cols-3">
        <TextareaField name="learningObjectives" label="What students will learn" rows={6} defaultValue={course.learningObjectives.join("\n")} error={state.fieldErrors?.learningObjectives} hint="One per line, up to 12." />
        <TextareaField name="prerequisites" label="Prerequisites" rows={6} defaultValue={course.prerequisites.join("\n")} hint="One per line." />
        <TextareaField name="targetAudience" label="Who it's for" rows={6} defaultValue={course.targetAudience.join("\n")} hint="One per line." />
      </div>
      {softwareTags.length ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Software covered</legend>
          <p className="text-sm text-muted-foreground">Helps students check version compatibility. Manage tags under Categories &amp; tags.</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {softwareTags.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input type="checkbox" name="tagIds" value={t.id} defaultChecked={selectedTags.has(t.id)} className="accent-[var(--primary)]" />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <TextareaField
        name="faq"
        label="Frequently asked questions"
        rows={6}
        mono
        defaultValue={faq}
        error={state.fieldErrors?.faq}
        hint="Write each question as “Q: …” and its answer on the next line as “A: …”, with a blank line between questions."
      />
      <SubmitButton className="justify-self-start">Save details</SubmitButton>
    </ActionForm>
  );
}
