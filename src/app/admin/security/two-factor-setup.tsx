"use client";

import { Copy, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { idle } from "@/lib/forms";
import { enableTwoFactorAction, startTwoFactorSetupAction, type EnableTwoFactorState, type TwoFactorSetupState } from "../actions";

export function TwoFactorSetup() {
  const [setup, startSetup] = useActionState<TwoFactorSetupState>(startTwoFactorSetupAction, { status: "idle" });
  const [enabled, enable] = useActionState<EnableTwoFactorState, FormData>(enableTwoFactorAction, idle);

  if (enabled.status === "success" && enabled.recoveryCodes) return <RecoveryCodes codes={enabled.recoveryCodes} />;

  if (setup.status !== "ready") {
    return (
      <form action={startSetup} className="grid gap-4">
        {setup.status === "error" ? <FormMessage state={{ status: "error", message: setup.message }} /> : null}
        <p className="text-muted-foreground">
          You&apos;ll need an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password.
        </p>
        <SubmitButton className="justify-self-start">Set up two-factor authentication</SubmitButton>
      </form>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[auto_1fr]">
      <div>
        <p className="mb-3 text-sm font-medium">1. Scan this QR code</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated on the server */}
        <img src={setup.qrDataUrl} alt="QR code for your authenticator app" width={200} height={200} className="rounded-md bg-white p-2" />
        <details className="mt-3 max-w-[216px] text-sm">
          <summary className="cursor-pointer text-primary">Can&apos;t scan? Enter the key</summary>
          <code className="mt-2 block font-mono text-xs break-all text-muted-foreground">{setup.secret}</code>
        </details>
      </div>
      <form action={enable} className="grid content-start gap-5" noValidate>
        <p className="text-sm font-medium">2. Enter the 6-digit code it shows</p>
        <FormMessage state={enabled} />
        <Field
          name="code"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className="max-w-48 font-mono text-lg tracking-[0.3em]"
          error={enabled.fieldErrors?.code}
        />
        <SubmitButton className="justify-self-start">Turn on two-factor</SubmitButton>
      </form>
    </div>
  );
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-5">
      <p className="flex items-center gap-2 font-medium text-success">
        <ShieldCheck className="size-5" aria-hidden="true" /> Two-factor authentication is on.
      </p>
      <div>
        <h3 className="font-semibold">Save your recovery codes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Each code works once if you lose your phone. They are shown only now — store them in a password manager.
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-2 rounded-md border border-border bg-background p-4 font-mono text-sm sm:max-w-md">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(codes.join("\n"));
            setCopied(true);
          }}
        >
          <Copy /> {copied ? "Copied" : "Copy codes"}
        </Button>
        {/* Full page load (not <Link>): the admin layout must re-render to unlock the navigation. */}
        <Button asChild>
          <a href="/admin">I&apos;ve saved them — continue</a>
        </Button>
      </div>
    </div>
  );
}
