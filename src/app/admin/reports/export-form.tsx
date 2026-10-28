"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { createExportAction } from "../completion-actions";

const statusOptions: Record<string, { value: string; label: string }[]> = {
  STUDENTS: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "DELETION_REQUESTED"].map((s) => ({ value: s, label: s.toLowerCase().replaceAll("_", " ") })),
  ENROLLMENTS: ["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED", "REVOKED"].map((s) => ({ value: s, label: s.toLowerCase() })),
  PROGRESS: ["ACTIVE", "EXPIRED"].map((s) => ({ value: s, label: s.toLowerCase() })),
  PAYMENTS: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED", "AUTHORIZED"].map((s) => ({ value: s, label: s.toLowerCase().replaceAll("_", " ") })),
  CERTIFICATES: [
    { value: "ISSUED", label: "valid" },
    { value: "REVOKED", label: "revoked" },
    { value: "SUPERSEDED", label: "replaced" },
  ],
};
const dateMeaning: Record<string, string> = { STUDENTS: "registered", ENROLLMENTS: "enrolled", PROGRESS: "enrolled", PAYMENTS: "created", CERTIFICATES: "issued" };

export function ExportForm({ types, courses }: { types: { value: string; label: string }[]; courses: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createExportAction, idle);
  const [type, setType] = useState(types[0]?.value ?? "ENROLLMENTS");
  return (
    <ActionForm action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <SelectField name="type" label="Report" options={types} defaultValue={type} onChange={setType} />
      {type !== "STUDENTS" ? <SelectField key={`c-${type}`} name="courseId" label="Course" options={[{ value: "", label: "All courses" }, ...courses]} /> : null}
      <SelectField key={`s-${type}`} name="status" label="Status" options={[{ value: "", label: "Any status" }, ...(statusOptions[type] ?? [])]} error={state.fieldErrors?.filters} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="from" type="date" label={`${dateMeaning[type] ?? "Created"} from`} />
        <Field name="to" type="date" label="to" />
      </div>
      <SubmitButton size="default" className="justify-self-start">
        Create CSV export
      </SubmitButton>
    </ActionForm>
  );
}

/** While an export is being built, re-render the list every few seconds. */
export function RefreshWhilePending({ pending }: { pending: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(id);
  }, [pending, router]);
  return null;
}
