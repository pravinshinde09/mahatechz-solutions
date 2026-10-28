"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import type { AdminQuiz } from "@/lib/contracts/assessment";
import { idle } from "@/lib/forms";
import { deleteQuestionAction, moveQuestionAction, saveQuestionAction, saveQuizSettingsAction } from "../../../../completion-actions";

type Question = AdminQuiz["questions"][number];
const typeOptions = [
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTI_CHOICE", label: "Multiple choice (all correct options required)" },
  { value: "TRUE_FALSE", label: "True / false" },
  { value: "NUMERIC", label: "Numeric answer (with tolerance)" },
];
export const typeName: Record<string, string> = { SINGLE_CHOICE: "Single choice", MULTI_CHOICE: "Multiple choice", TRUE_FALSE: "True / false", NUMERIC: "Numeric" };

export function QuizSettingsForm({ courseId, quiz }: { courseId: string; quiz: AdminQuiz }) {
  const [state, action, pending] = useActionState(saveQuizSettingsAction.bind(null, courseId, quiz.id), idle);
  const errors = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <Field name="passPercent" label="Pass mark (%)" inputMode="numeric" defaultValue={String(quiz.passPercent)} error={errors.passPercent} />
      <Field name="maxAttempts" label="Attempts allowed" inputMode="numeric" defaultValue={quiz.maxAttempts === null ? "" : String(quiz.maxAttempts)} error={errors.maxAttempts} hint="Empty = unlimited. The best attempt counts." />
      <Field name="timeLimitMinutes" label="Time limit (minutes)" inputMode="decimal" defaultValue={quiz.timeLimitSeconds === null ? "" : String(quiz.timeLimitSeconds / 60)} error={errors.timeLimitSeconds} hint="Empty = no limit. Saved answers are submitted when time runs out." />
      <SelectField
        name="showAnswersAfter"
        label="Show correct answers"
        defaultValue={quiz.showAnswersAfter}
        options={[
          { value: "AFTER_SUBMIT", label: "After each submission" },
          { value: "AFTER_PASS", label: "Only after passing" },
          { value: "NEVER", label: "Never (score only)" },
        ]}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="shuffleQuestions" defaultChecked={quiz.shuffleQuestions} className="size-4 accent-[var(--primary)]" /> Shuffle question order for each attempt
      </label>
      <SubmitButton size="sm" className="justify-self-start">
        Save settings
      </SubmitButton>
    </ActionForm>
  );
}

/** Add or edit one question; the API validates the answer key (exactly one correct for single choice, …). */
export function QuestionEditor({ courseId, quizId, question }: { courseId: string; quizId: string; question: Question | null }) {
  const [state, action, pending] = useActionState(saveQuestionAction.bind(null, courseId, quizId, question?.id ?? null), idle);
  const [type, setType] = useState<string>(question?.type ?? "SINGLE_CHOICE");
  const [options, setOptions] = useState<{ label: string; isCorrect: boolean }[]>(
    question && question.type !== "TRUE_FALSE" && question.type !== "NUMERIC" ? question.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })) : [{ label: "", isCorrect: true }, { label: "", isCorrect: false }],
  );
  const errors = state.fieldErrors ?? {};
  const tf = question?.type === "TRUE_FALSE" ? (question.options.find((o) => o.isCorrect)?.label === "True" ? "true" : "false") : "true";
  const single = type === "SINGLE_CHOICE";

  return (
    <ActionForm action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <SelectField id={`type-${question?.id ?? "new"}`} name="type" label="Question type" options={typeOptions} defaultValue={type} onChange={setType} />
      <TextareaField id={`prompt-${question?.id ?? "new"}`} name="prompt" label="Question" rows={3} defaultValue={state.values?.prompt ?? question?.prompt} error={errors.prompt} />

      {type === "NUMERIC" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`ans-${question?.id ?? "new"}`} name="numericAnswer" label="Correct answer" inputMode="decimal" defaultValue={question?.numericAnswer === null || question?.numericAnswer === undefined ? "" : String(question.numericAnswer)} error={errors.numericAnswer} />
          <Field id={`tol-${question?.id ?? "new"}`} name="numericTolerance" label="Accepted ± tolerance" inputMode="decimal" defaultValue={question?.numericTolerance ? String(question.numericTolerance) : "0"} hint="e.g. 0.1 accepts 4.5–4.7 for 4.6" />
        </div>
      ) : type === "TRUE_FALSE" ? (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Correct answer</legend>
          {["true", "false"].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="trueFalse" value={v} defaultChecked={tf === v} className="size-4 accent-[var(--primary)]" /> {v === "true" ? "True" : "False"}
            </label>
          ))}
        </fieldset>
      ) : (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Options — mark {single ? "the correct one" : "every correct one"}</legend>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={single ? "radio" : "checkbox"}
                name="optionCorrect"
                value={String(i)}
                checked={o.isCorrect}
                onChange={() => setOptions(options.map((x, j) => (single ? { ...x, isCorrect: i === j } : i === j ? { ...x, isCorrect: !x.isCorrect } : x)))}
                aria-label={`Option ${i + 1} is correct`}
                className="size-4 shrink-0 accent-[var(--primary)]"
              />
              <input
                name="optionLabel"
                value={o.label}
                onChange={(e) => setOptions(options.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)))}
                aria-label={`Option ${i + 1}`}
                maxLength={500}
                className="h-10 min-w-0 flex-1 rounded-sm border border-input bg-surface px-3"
              />
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove option ${i + 1}`} disabled={options.length <= 2} onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </div>
          ))}
          {options.length < 8 ? (
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setOptions([...options, { label: "", isCorrect: false }])}>
              <Plus /> Add option
            </Button>
          ) : null}
          {errors.options ? <p className="text-sm text-danger">{errors.options}</p> : null}
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field id={`pts-${question?.id ?? "new"}`} name="points" label="Points" inputMode="numeric" defaultValue={String(question?.points ?? 1)} error={errors.points} />
        <TextareaField id={`exp-${question?.id ?? "new"}`} name="explanation" label="Explanation (shown with answers, optional)" rows={2} defaultValue={question?.explanation ?? ""} />
      </div>
      <SubmitButton size="sm" className="justify-self-start">
        {question ? "Save question" : "Add question"}
      </SubmitButton>
    </ActionForm>
  );
}

export function QuestionList({ courseId, quiz }: { courseId: string; quiz: AdminQuiz }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ status: string; message?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res.status === "error") setError(res.message ?? "Something went wrong.");
    });
  const ids = quiz.questions.map((q) => q.id);
  const swap = (i: number, j: number) => {
    const next = [...ids];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <ol className="grid gap-3">
        {quiz.questions.map((q, i) => (
          <li key={q.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start gap-3">
              <span className="font-mono text-sm text-muted-foreground">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium whitespace-pre-line">{q.prompt}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeName[q.type]} · {q.points} pt{q.points === 1 ? "" : "s"} ·{" "}
                  {q.type === "NUMERIC" ? `answer ${q.numericAnswer}${q.numericTolerance ? ` ± ${q.numericTolerance}` : ""}` : `correct: ${q.options.filter((o) => o.isCorrect).map((o) => o.label).join(", ")}`}
                </p>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move question ${i + 1} up`} disabled={pending || i === 0} onClick={() => run(() => moveQuestionAction(courseId, quiz.id, swap(i, i - 1)))}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move question ${i + 1} down`} disabled={pending || i === ids.length - 1} onClick={() => run(() => moveQuestionAction(courseId, quiz.id, swap(i, i + 1)))}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(editing === q.id ? null : q.id)}>
                  {editing === q.id ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-danger"
                  aria-label={`Delete question ${i + 1}`}
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Delete this question? Past attempts keep their scores.")) run(() => deleteQuestionAction(courseId, quiz.id, q.id));
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            {editing === q.id ? (
              <div className="mt-4 border-t border-border pt-4">
                <QuestionEditor courseId={courseId} quizId={quiz.id} question={q} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
