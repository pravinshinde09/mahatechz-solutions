"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string | undefined }) {
  const [state, action] = useActionState(loginAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
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
      <div className="grid gap-2">
        <PasswordField name="password" label="Password" autoComplete="current-password" error={state.fieldErrors?.password} />
        <Link href="/forgot-password" className="justify-self-end text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  );
}
