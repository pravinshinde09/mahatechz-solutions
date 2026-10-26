"use client";

import { MailWarning } from "lucide-react";
import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { idle, type FormState } from "@/lib/forms";
import { resendVerificationAction } from "./actions";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action] = useActionState<FormState>(resendVerificationAction, idle);
  return (
    <Alert variant="warning" className="mb-8">
      <MailWarning />
      <AlertTitle>Verify your email to enrol in courses</AlertTitle>
      <AlertDescription>
        <p>
          We sent a link to <strong className="break-all">{email}</strong>.
        </p>
        {state.status === "idle" ? (
          <form action={action} className="mt-2">
            <SubmitButton size="sm" variant="outline">
              Resend link
            </SubmitButton>
          </form>
        ) : (
          <p className="mt-1" aria-live="polite">
            {state.message}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
