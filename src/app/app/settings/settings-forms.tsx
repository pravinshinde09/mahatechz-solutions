"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { changePasswordAction, updateProfileAction } from "../actions";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string | null; email: string }) {
  const [state, action] = useActionState(updateProfileAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <Field name="email" label="Email" value={email} readOnly disabled hint="Contact support to change your email address." />
      <Field name="fullName" label="Full name" autoComplete="name" required maxLength={120} defaultValue={fullName} error={state.fieldErrors?.fullName} />
      <Field
        name="phone"
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        placeholder="+919876543210"
        defaultValue={phone ?? ""}
        hint="International format, e.g. +919876543210. Leave empty to remove."
        error={state.fieldErrors?.phone}
      />
      <SubmitButton size="default" className="justify-self-start">
        Save profile
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(changePasswordAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      {/* Lets password managers associate the new password with this account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <FormMessage state={state} />
      <PasswordField name="currentPassword" label="Current password" autoComplete="current-password" error={state.fieldErrors?.currentPassword} />
      <PasswordField name="newPassword" label="New password" autoComplete="new-password" hint="At least 10 characters." error={state.fieldErrors?.newPassword} />
      <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" error={state.fieldErrors?.confirmPassword} />
      <SubmitButton size="default" className="justify-self-start">
        Change password
      </SubmitButton>
    </form>
  );
}
