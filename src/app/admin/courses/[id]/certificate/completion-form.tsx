"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { idle } from "@/lib/forms";
import { saveCompletionSettingsAction } from "../../../completion-actions";

/** Spec §15.3 rule + §10.1 certificate fields, on one tab. */
export function CompletionForm({ course, templates, quizzes }: { course: AdminCourse; templates: { value: string; label: string }[] | null; quizzes: { id: string; title: string; published: boolean }[] }) {
  const [state, action, pending] = useActionState(saveCompletionSettingsAction.bind(null, course.id), idle);
  const rule = course.completionRule;
  const [requireAll, setRequireAll] = useState(rule.requireAllRequiredLessons);
  const [enabled, setEnabled] = useState(course.certificateEnabled);
  const errors = state.fieldErrors ?? {};
  const check = "size-4 accent-[var(--primary)]";

  return (
    <ActionForm action={action} pending={pending} className="grid gap-8">
      <FormMessage state={state} />

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-sans text-lg font-semibold">Completion rule</legend>
        <p className="-mt-2 text-sm text-muted-foreground">The course is complete when every condition holds. Lessons count only when required and published.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requireAllRequiredLessons" checked={requireAll} onChange={(e) => setRequireAll(e.target.checked)} className={check} />
          Every required lesson must be completed
        </label>
        {!requireAll ? (
          <Field name="minimumLessonCompletionPercent" label="Minimum share of required lessons (%)" inputMode="numeric" defaultValue={String(rule.minimumLessonCompletionPercent === 100 ? 80 : rule.minimumLessonCompletionPercent)} error={errors.minimumLessonCompletionPercent} />
        ) : null}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="excludeSelfReportedLessons" defaultChecked={rule.excludeSelfReportedLessons} className={`${check} mt-0.5`} />
          <span>
            Don&apos;t count self-reported lessons (YouTube/Vimeo/Drive videos the student marked complete). <span className="text-muted-foreground">Admin overrides still count.</span>
          </span>
        </label>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Quizzes the student must pass</p>
          {quizzes.length ? (
            <ul className="grid gap-1.5">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="requiredQuizIds" value={q.id} defaultChecked={rule.requiredQuizIds.includes(q.id)} className={check} />
                    {q.title} {q.published ? null : <span className="text-xs text-muted-foreground">(unpublished)</span>}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No quiz lessons yet. Add a Quiz lesson on the{" "}
              <Link href={`/admin/courses/${course.id}/syllabus`} className="text-primary hover:underline">
                Syllabus
              </Link>{" "}
              tab.
            </p>
          )}
        </div>
        {quizzes.length ? (
          <Field
            name="minimumAverageQuizScorePercent"
            label="Minimum average quiz score (%, optional)"
            inputMode="numeric"
            defaultValue={rule.minimumAverageQuizScorePercent === null ? "" : String(rule.minimumAverageQuizScorePercent)}
            error={errors.minimumAverageQuizScorePercent}
            hint="Average of each student's best attempt on the required quizzes; leave empty for none."
          />
        ) : null}
        <Field
          name="recommendedDurationDays"
          label="Recommended duration (days, optional)"
          inputMode="numeric"
          defaultValue={course.recommendedDurationDays === null ? "" : String(course.recommendedDurationDays)}
          error={errors.recommendedDurationDays}
          hint="Used to flag students who fall well behind the expected pace in analytics."
        />
      </fieldset>

      <fieldset className="grid gap-4 border-t border-border pt-6">
        <legend className="mb-2 font-sans text-lg font-semibold">Certificate</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="certificateEnabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className={check} />
          Award a certificate when a student completes the course
        </label>
        {enabled ? (
          <>
            {templates === null ? (
              <>
                <input type="hidden" name="certificateTemplateId" value={course.certificateTemplateId ?? ""} />
                <p className="text-sm text-muted-foreground">Only admins can choose the certificate template.</p>
              </>
            ) : templates.length ? (
              <SelectField name="certificateTemplateId" label="Template" defaultValue={course.certificateTemplateId ?? ""} options={[{ value: "", label: "Choose a template…" }, ...templates]} error={errors.certificateTemplateId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No templates yet —{" "}
                <Link href="/admin/certificates/templates/new" className="text-primary hover:underline">
                  create one
                </Link>
                .
              </p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="autoIssueCertificate" defaultChecked={course.autoIssueCertificate} className={`${check} mt-0.5`} />
              <span>
                Issue automatically when the course is completed. <span className="text-muted-foreground">Otherwise an admin issues from Certificates › Ready to issue.</span>
              </span>
            </label>
            <Field
              name="certificateCode"
              label="Course code on certificate numbers (optional)"
              defaultValue={course.certificateCode ?? ""}
              maxLength={8}
              error={errors.certificateCode}
              hint="2–8 letters or digits, e.g. ACE → MZT-ACE-2027-000042. Empty uses the title's initials."
              className="uppercase"
            />
          </>
        ) : (
          <input type="hidden" name="certificateTemplateId" value={course.certificateTemplateId ?? ""} />
        )}
      </fieldset>

      <SubmitButton className="justify-self-start">Save</SubmitButton>
    </ActionForm>
  );
}
