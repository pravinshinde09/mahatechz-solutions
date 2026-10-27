import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field";

export function TextareaField({
  name,
  id: idProp,
  label,
  defaultValue,
  error,
  hint,
  rows = 4,
  maxLength,
  mono = false,
}: {
  name: string;
  /** Needed when two forms on one page share a field name (ids must be unique). */
  id?: string;
  label: string;
  defaultValue?: string | undefined;
  error?: string | undefined;
  hint?: ReactNode;
  rows?: number;
  maxLength?: number;
  mono?: boolean;
}) {
  const id = idProp ?? `field-${name}`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-sm border border-input bg-surface px-3 py-2 text-base leading-6 ${mono ? "font-mono text-sm" : ""}`}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}
