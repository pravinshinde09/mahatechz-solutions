"use client";

import { useActionState } from "react";
import { Field, FieldError } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { idle } from "@/lib/forms";
import { inviteStaffAction } from "../actions";

const roles = [
  { value: "ADMIN", label: "Admin", hint: "Courses, students, payments and certificates." },
  { value: "INSTRUCTOR", label: "Instructor", hint: "Content and progress for their assigned courses." },
  { value: "SUPPORT", label: "Support", hint: "Students and tickets; no payments or content editing." },
  { value: "SUPER_ADMIN", label: "Super admin", hint: "Everything, including staff and platform settings." },
];

export function InviteForm() {
  const [state, action] = useActionState(inviteStaffAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate key={state.status === "success" ? state.message : "form"}>
      <FormMessage state={state} />
      <Field name="fullName" label="Full name" required maxLength={120} defaultValue={state.values?.fullName} error={state.fieldErrors?.fullName} />
      <Field name="email" label="Work email" type="email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <div className="grid gap-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          name="role"
          required
          defaultValue={state.values?.role ?? "ADMIN"}
          aria-invalid={state.fieldErrors?.role ? true : undefined}
          className="h-11 w-full min-w-0 rounded-sm border border-input bg-surface px-3 text-base"
          aria-describedby="invite-role-hints"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <dl id="invite-role-hints" className="mt-1 grid gap-1 text-sm text-muted-foreground">
          {roles.map((r) => (
            <div key={r.value}>
              <dt className="inline font-medium text-foreground">{r.label}:</dt> <dd className="inline">{r.hint}</dd>
            </div>
          ))}
        </dl>
        <FieldError id="invite-role-error" error={state.fieldErrors?.role} />
      </div>
      <SubmitButton size="default" className="justify-self-start">
        Send invitation
      </SubmitButton>
    </form>
  );
}
