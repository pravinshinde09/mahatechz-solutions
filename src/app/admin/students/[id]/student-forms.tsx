"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { issueCertificateAction, overrideCompletionAction } from "../../completion-actions";

/** Spec §15.4: course-level override with a reason (≥ 10 characters), audit-logged by the API. */
export function CourseOverrideForm({ enrollmentId, studentId, completed, heldIncomplete }: { enrollmentId: string; studentId: string; completed: boolean; heldIncomplete: boolean }) {
  const [state, action, pending] = useActionState(overrideCompletionAction.bind(null, enrollmentId, studentId), idle);
  const options = [...(!completed ? [{ value: "MARK_COMPLETE", label: "Mark course complete" }] : []), ...(completed || !heldIncomplete ? [{ value: "MARK_INCOMPLETE", label: "Mark course incomplete" }] : [])];
  const [chosen, setChosen] = useState(options[0]?.value ?? "MARK_COMPLETE");
  return (
    <details>
      <summary className="cursor-pointer text-sm text-primary hover:underline">Override completion…</summary>
      <ActionForm
        action={(form) => {
          if (chosen === "MARK_INCOMPLETE" && !window.confirm("Mark this course incomplete? It stays incomplete until an admin marks it complete again; an issued certificate is not revoked automatically.")) return;
          action(form);
        }}
        pending={pending}
        className="mt-3 grid gap-3 rounded-md border border-border bg-background/40 p-3"
      >
        <FormMessage state={state} />
        <SelectField id={`ov-action-${enrollmentId}`} name="action" label="Action" options={options} defaultValue={chosen} onChange={setChosen} />
        <TextareaField id={`ov-reason-${enrollmentId}`} name="reason" label="Reason (at least 10 characters, audit-logged)" rows={2} defaultValue={state.values?.reason} error={state.fieldErrors?.reason} />
        <SubmitButton size="sm" variant={chosen === "MARK_INCOMPLETE" ? "destructive" : "default"} className="justify-self-start">
          Apply override
        </SubmitButton>
      </ActionForm>
    </details>
  );
}

export function LessonOverrideForm({ enrollmentId, studentId, lessonId, title }: { enrollmentId: string; studentId: string; lessonId: string; title: string }) {
  const [state, action, pending] = useActionState(overrideCompletionAction.bind(null, enrollmentId, studentId), idle);
  if (state.status === "success") return <span className="text-xs text-success">Marked complete</span>;
  return (
    <details className="text-right">
      <summary className="cursor-pointer text-xs text-primary hover:underline">Mark complete…</summary>
      <ActionForm action={action} pending={pending} className="mt-2 grid gap-2 text-left">
        <FormMessage state={state} />
        <input type="hidden" name="action" value="MARK_LESSON_COMPLETE" />
        <input type="hidden" name="lessonId" value={lessonId} />
        <TextareaField id={`lo-${lessonId}`} name="reason" label={`Reason for completing "${title}"`} rows={2} error={state.fieldErrors?.reason} />
        <SubmitButton size="sm" className="justify-self-start">
          Mark complete
        </SubmitButton>
      </ActionForm>
    </details>
  );
}

/** T-13 in the UI: eligible → issue; ineligible → only with "override" ticked and a reason. */
export function IssueCertificateForm({ enrollmentId, studentId, eligible }: { enrollmentId: string; studentId: string | null; eligible: boolean }) {
  const [state, action, pending] = useActionState(issueCertificateAction.bind(null, enrollmentId, studentId), idle);
  const [override, setOverride] = useState(false);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <ActionForm action={action} pending={pending} className="grid gap-3">
      <FormMessage state={state} />
      {!eligible ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="override" checked={override} onChange={(e) => setOverride(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span>Issue anyway (override eligibility). The reason is recorded in the audit log and the certificate is marked as overridden.</span>
        </label>
      ) : null}
      {override ? <TextareaField id={`issue-reason-${enrollmentId}`} name="reason" label="Reason (at least 10 characters)" rows={2} defaultValue={state.values?.reason} error={state.fieldErrors?.reason} /> : null}
      <SubmitButton size="sm" className="justify-self-start" variant={eligible || override ? "default" : "outline"}>
        Issue certificate
      </SubmitButton>
    </ActionForm>
  );
}
