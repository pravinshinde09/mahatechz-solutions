"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { useActionFormPending } from "./action-form";

/** Shows a spinner while the form's action is pending and keeps its width (spec §21.5 loading). */
export function SubmitButton({
  children,
  className,
  size = "lg",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "lg" | "sm";
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  const { pending: formPending } = useFormStatus();
  const actionFormPending = useActionFormPending();
  const pending = formPending || actionFormPending;
  return (
    <Button type="submit" size={size} variant={variant} className={className} disabled={pending} aria-disabled={pending}>
      {pending ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}
