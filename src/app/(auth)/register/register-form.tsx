"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FieldError } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { registerAction } from "../actions";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <Field name="fullName" label="Full name" autoComplete="name" required maxLength={120} defaultValue={state.values?.fullName} error={state.fieldErrors?.fullName} />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        name="phone"
        label="Mobile number (optional)"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="98765 43210"
        defaultValue={state.values?.phone}
        hint="Used only for class and payment updates."
        error={state.fieldErrors?.phone}
      />
      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        hint="At least 10 characters. A short phrase is easier to remember."
        error={state.fieldErrors?.password}
      />
      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            defaultChecked={state.values?.acceptTerms === "on"}
            aria-invalid={state.fieldErrors?.acceptTerms ? true : undefined}
            aria-describedby={state.fieldErrors?.acceptTerms ? "accept-terms-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
          />
          <span className="text-muted-foreground">
            I agree to the{" "}
            <Link href="/terms" className="text-primary underline" target="_blank">
              Terms of use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline" target="_blank">
              Privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldError id="accept-terms-error" error={state.fieldErrors?.acceptTerms} />
      </div>
      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
