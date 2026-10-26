"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field";

interface Props {
  name: string;
  label: string;
  error?: string | undefined;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}

export function PasswordField({ name, label, error, autoComplete, hint }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === "new-password" ? 10 : 1}
          maxLength={128}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-sm text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}
