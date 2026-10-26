import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps extends React.ComponentProps<"input"> {
  name: string;
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
}

/** Labelled input with an inline error linked through aria-describedby (spec §21.5 error state). */
export function Field({ name, label, error, hint, id, ...props }: FieldProps) {
  const fieldId = id ?? `field-${name}`;
  const describedBy = [hint && !error ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${fieldId}-error`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id: string; error?: string | undefined }) {
  if (!error) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-danger">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0 fill-current">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 10.5h-1.5V10h1.5v1.5Zm0-3h-1.5v-4h1.5v4Z" />
      </svg>
      {error}
    </p>
  );
}
