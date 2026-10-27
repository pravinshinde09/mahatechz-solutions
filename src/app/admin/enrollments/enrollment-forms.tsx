"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { idle } from "@/lib/forms";
import { grantEnrollmentAction, updateEnrollmentAction } from "../commerce-actions";

export function GrantForm({ courses }: { courses: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(grantEnrollmentAction, idle);
  return (
    <ActionForm key={state.status === "success" ? state.message : "grant"} action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <Field id="grant-email" name="email" type="email" label="Student email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} hint="The student must already have an account." />
      <SelectField id="grant-course" name="courseId" label="Course" options={courses} defaultValue={state.values?.courseId} error={state.fieldErrors?.courseId} />
      <TextareaField id="grant-reason" name="reason" label="Reason (at least 10 characters)" rows={2} defaultValue={state.values?.reason} error={state.fieldErrors?.reason} />
      <Field id="grant-expires" name="expiresAt" type="date" label="Access until (optional)" error={state.fieldErrors?.expiresAt} hint="Leave empty to use the course's normal access period." />
      <SubmitButton size="default" className="justify-self-start">
        Grant access
      </SubmitButton>
    </ActionForm>
  );
}

const actionsFor = (status: string) =>
  [
    ...(["ACTIVE", "EXPIRED"].includes(status) ? [{ value: "extend", label: "Extend access" }] : []),
    ...(status === "ACTIVE" ? [{ value: "suspend", label: "Suspend access" }] : []),
    ...(["SUSPENDED", "REVOKED"].includes(status) ? [{ value: "reactivate", label: "Reactivate" }] : []),
    ...(status !== "REVOKED" ? [{ value: "revoke", label: "Revoke access" }] : []),
  ] as const;

export function EnrollmentRowActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(updateEnrollmentAction.bind(null, id), idle);
  const options = actionsFor(status);
  const [chosen, setChosen] = useState<string>(options[0]?.value ?? "revoke");
  const [lifetime, setLifetime] = useState(false);
  if (!options.length) return null;
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-primary hover:underline">Change access…</summary>
      <ActionForm
        action={(form) => {
          if ((chosen === "revoke" || chosen === "suspend") && !window.confirm(`${chosen === "revoke" ? "Revoke" : "Suspend"} this student's access?`)) return;
          action(form);
        }}
        pending={pending}
        className="mt-3 grid gap-3 rounded-md border border-border bg-background/40 p-3"
      >
        <FormMessage state={state} />
        <SelectField id={`action-${id}`} name="action" label="Action" options={[...options]} defaultValue={chosen} onChange={setChosen} />
        {chosen === "extend" ? (
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lifetime" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Lifetime access
            </label>
            {!lifetime ? <Field id={`expires-${id}`} name="expiresAt" type="date" label="New expiry date" error={state.fieldErrors?.expiresAt} /> : null}
          </div>
        ) : null}
        <Field id={`reason-${id}`} name="reason" label="Reason" required minLength={5} error={state.fieldErrors?.reason} />
        <SubmitButton size="sm" variant={chosen === "revoke" ? "destructive" : "default"} className="justify-self-start">
          Apply
        </SubmitButton>
      </ActionForm>
    </details>
  );
}
