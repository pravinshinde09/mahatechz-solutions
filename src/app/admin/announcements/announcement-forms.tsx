"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { idle, type FormState } from "@/lib/forms";
import { createAnnouncementAction, deleteAnnouncementAction, publishAnnouncementAction } from "../learning-actions";

export function NewAnnouncementForm({ courses, canPostPlatform }: { courses: { value: string; label: string }[]; canPostPlatform: boolean }) {
  const [state, action, pending] = useActionState(createAnnouncementAction, idle);
  const [scope, setScope] = useState(canPostPlatform && !courses.length ? "PLATFORM" : "COURSE");
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const e = state.fieldErrors ?? {};
  return (
    <ActionForm key={state.values?.sent ?? "new"} action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      {canPostPlatform ? (
        <SelectField
          name="scope"
          label="Audience"
          options={[
            { value: "COURSE", label: "Students of one course" },
            { value: "PLATFORM", label: "Every student (platform-wide)" },
          ]}
          defaultValue={v.scope ?? scope}
          onChange={setScope}
        />
      ) : (
        <input type="hidden" name="scope" value="COURSE" />
      )}
      {scope === "COURSE" ? <SelectField name="courseId" label="Course" options={courses} defaultValue={v.courseId} error={e.courseId} /> : null}
      <Field name="title" label="Title" required maxLength={160} defaultValue={v.title} error={e.title} />
      <TextareaField name="body" label="Message (Markdown)" rows={5} maxLength={10000} defaultValue={v.body} error={e.body} />
      <Field name="expiresAt" type="datetime-local" label="Hide after (optional, IST)" error={e.expiresAt} />
      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" defaultChecked className="size-4 accent-[var(--primary)]" /> Publish now (students get an in-app notification)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendEmail" className="size-4 accent-[var(--primary)]" /> Also email it (sent once, on first publish)
        </label>
      </div>
      <SubmitButton className="justify-self-start">Save announcement</SubmitButton>
    </ActionForm>
  );
}

export function AnnouncementRowActions({ id, published }: { id: string; published: boolean }) {
  const [state, setState] = useState<FormState>(idle);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<FormState>) => {
    setBusy(true);
    setState(await fn());
    setBusy(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => publishAnnouncementAction(id, !published))}>
        {published ? "Unpublish" : "Publish"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-danger"
        disabled={busy}
        onClick={() => {
          if (window.confirm("Delete this announcement?")) void run(() => deleteAnnouncementAction(id));
        }}
      >
        Delete
      </Button>
      {state.status === "error" ? (
        <span className="text-xs text-danger" role="alert">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}
