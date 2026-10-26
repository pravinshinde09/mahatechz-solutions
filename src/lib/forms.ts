import type { z } from "zod";
import type { ApiError } from "@/lib/api/server";

/** Result returned by every form Server Action, consumed with `useActionState`. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of non-secret fields so the form keeps them after an error. */
  values?: Record<string, string>;
};

export const idle: FormState = { status: "idle" };

export function fromZod(error: z.ZodError, values?: Record<string, string>): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= humanize(key, issue);
  }
  return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, ...(values ? { values } : {}) };
}

function humanize(key: string, issue: z.core.$ZodIssue): string {
  if (key === "password" || key === "newPassword") {
    if (issue.code === "too_small") return "Use at least 10 characters.";
    if (issue.code === "too_big") return "Use at most 128 characters.";
  }
  if (key === "email") return "Enter a valid email address.";
  if (key === "acceptTerms") return "Please accept the terms to continue.";
  if (key === "code") return "Enter the 6-digit code from your authenticator app.";
  if (issue.code === "too_small") return "This field is required.";
  return issue.message;
}

/** Maps an API error (§20.2) onto form state; field details become inline errors. */
export function fromApi(error: ApiError, values?: Record<string, string>): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const d of error.details ?? []) {
    const key = d.path.replace(/^body\./, "").split(".")[0];
    if (key) fieldErrors[key] ??= error.code === "VALIDATION_FAILED" && error.details?.length === 1 ? error.message : d.issue;
  }
  return {
    status: "error",
    message: error.code === "RATE_LIMITED" ? "Too many attempts. Please wait a few minutes and try again." : error.message,
    ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
    ...(values ? { values } : {}),
  };
}

export const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};
