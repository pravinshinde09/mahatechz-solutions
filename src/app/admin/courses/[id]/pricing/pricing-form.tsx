"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { idle } from "@/lib/forms";
import { paiseToRupees, toIstInput } from "@/lib/format";
import { updatePricingAction } from "../../actions";

export function PricingForm({ course }: { course: AdminCourse }) {
  const [state, action, pending] = useActionState(updatePricingAction.bind(null, course.id), idle);
  const [lifetime, setLifetime] = useState(course.accessDurationDays === null);
  const errors = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} pending={pending} className="grid gap-6">
      <FormMessage state={state} />
      <Field name="price" label="Price (₹, GST inclusive)" inputMode="decimal" required defaultValue={paiseToRupees(course.pricePaise)} error={errors.price ?? errors.pricePaise} hint="0 = free course. Paid courses cost at least ₹1." />

      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium">Limited-time offer (optional)</legend>
        <Field name="promoPrice" label="Offer price (₹)" inputMode="decimal" defaultValue={paiseToRupees(course.promoPricePaise)} error={errors.promoPrice ?? errors.promoPricePaise} hint="Leave empty for no offer. Must be lower than the price." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="promoStartsAt" label="Starts (IST)" type="datetime-local" defaultValue={toIstInput(course.promoStartsAt)} error={errors.promoStartsAt} />
          <Field name="promoEndsAt" label="Ends (IST)" type="datetime-local" defaultValue={toIstInput(course.promoEndsAt)} error={errors.promoEndsAt} />
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Access duration</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="lifetime" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Lifetime access
        </label>
        {!lifetime ? (
          <Field name="accessDurationDays" label="Days of access after enrolment" inputMode="numeric" defaultValue={String(course.accessDurationDays ?? 365)} error={errors.accessDurationDays} />
        ) : null}
      </fieldset>

      <SelectField
        name="enrollmentMode"
        label="Enrolment"
        defaultValue={course.enrollmentMode}
        options={[
          { value: "OPEN", label: "Open — anyone can enrol" },
          { value: "INVITE_ONLY", label: "Invite only — admins enrol students" },
          { value: "CLOSED", label: "Closed — no new enrolments" },
        ]}
      />
      <SubmitButton className="justify-self-start">Save pricing</SubmitButton>
    </ActionForm>
  );
}
