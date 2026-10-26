"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, idle);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      {state.status !== "success" ? (
        <>
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
          <SubmitButton className="w-full">Send reset link</SubmitButton>
        </>
      ) : null}
    </form>
  );
}
