"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { acceptInvitationAction, resetPasswordAction } from "./actions";

/** Password reset, first-time admin setup, and staff invitation acceptance share this form. */
export function SetPasswordForm({ token, mode, defaultName }: { token: string; mode: "reset" | "invitation"; defaultName?: string }) {
  const [state, action] = useActionState(mode === "invitation" ? acceptInvitationAction : resetPasswordAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      {mode === "invitation" ? (
        <Field
          name="fullName"
          label="Your name"
          autoComplete="name"
          maxLength={120}
          defaultValue={state.values?.fullName ?? defaultName}
          error={state.fieldErrors?.fullName}
        />
      ) : null}
      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        hint="At least 10 characters. Avoid common words and your email."
        error={state.fieldErrors?.password}
      />
      <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" error={state.fieldErrors?.confirmPassword} />
      <SubmitButton className="w-full">{mode === "invitation" ? "Create staff account" : "Set password"}</SubmitButton>
    </form>
  );
}
