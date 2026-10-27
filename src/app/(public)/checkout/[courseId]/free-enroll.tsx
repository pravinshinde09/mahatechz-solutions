"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { freeEnrollAction } from "../actions";

export function FreeEnroll({ courseId }: { courseId: string }) {
  const [state, action] = useActionState(freeEnrollAction.bind(null, courseId), idle);
  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <p className="text-sm text-muted-foreground">This course is free. Enrol to start learning straight away.</p>
      <SubmitButton className="w-full">Enrol for free</SubmitButton>
    </form>
  );
}
