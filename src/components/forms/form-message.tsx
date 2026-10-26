import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/forms";

/** Form-level status (icon + text, never colour alone). Announced to screen readers. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const success = state.status === "success";
  return (
    <Alert variant={success ? "success" : "destructive"} aria-live="polite">
      {success ? <CircleCheck /> : <CircleAlert />}
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
