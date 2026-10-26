"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { verifyTwoFactorAction } from "../../actions";

export function TwoFactorForm({ next }: { next?: string | undefined }) {
  const [state, action] = useActionState(verifyTwoFactorAction, idle);
  const [mode, setMode] = useState<"code" | "recovery">("code");
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="mode" value={mode} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {mode === "code" ? (
        <Field
          key="code"
          name="code"
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className="font-mono text-lg tracking-[0.3em]"
          error={state.fieldErrors?.code}
        />
      ) : (
        <Field
          key="recovery"
          name="recoveryCode"
          label="Recovery code"
          autoComplete="off"
          placeholder="XXXXX-XXXXX"
          required
          autoFocus
          className="font-mono uppercase"
          error={state.fieldErrors?.recoveryCode}
        />
      )}
      <SubmitButton className="w-full">Verify and sign in</SubmitButton>
      <button
        type="button"
        onClick={() => setMode((m) => (m === "code" ? "recovery" : "code"))}
        className="justify-self-center text-sm text-primary hover:underline"
      >
        {mode === "code" ? "Use a recovery code instead" : "Use your authenticator app instead"}
      </button>
    </form>
  );
}
