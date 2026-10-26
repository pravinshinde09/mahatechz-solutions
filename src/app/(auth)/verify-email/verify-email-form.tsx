"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { idle } from "@/lib/forms";
import { verifyEmailAction } from "../actions";

// A button (not auto-submit on load) so link scanners in mail clients can't consume the token.
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmailAction, idle);
  if (state.status === "success") {
    return (
      <div className="grid gap-5">
        <FormMessage state={state} />
        <Button asChild size="lg" className="w-full">
          <Link href="/app">Continue to your dashboard</Link>
        </Button>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton className="w-full">Verify my email</SubmitButton>
    </form>
  );
}
