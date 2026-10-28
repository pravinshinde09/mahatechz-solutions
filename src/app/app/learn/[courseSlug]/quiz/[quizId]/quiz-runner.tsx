"use client";

import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Cloud, CloudOff, Loader2, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Answer, Attempt, QuizOverview } from "@/lib/contracts/assessment";
import { saveAnswers, startAttempt, submitAttempt } from "@/lib/learn-client";

type Given = { optionIds: string[]; numericValue: number | null; numericText: string };
type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 1200;
const typeHint = { SINGLE_CHOICE: "Choose one answer.", TRUE_FALSE: "Choose true or false.", MULTI_CHOICE: "Choose every correct answer.", NUMERIC: "Enter a number." } as const;

function fromAttempt(attempt: Attempt | null): Record<string, Given> {
  return Object.fromEntries((attempt?.answers ?? []).map((a) => [a.questionId, { optionIds: a.optionIds, numericValue: a.numericValue, numericText: a.numericValue === null ? "" : String(a.numericValue) }]));
}
const isAnswered = (g: Given | undefined) => !!g && (g.optionIds.length > 0 || g.numericValue !== null);
const toAnswer = (questionId: string, g: Given): Answer => ({ questionId, optionIds: g.optionIds, numericValue: g.numericValue });

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizRunner({ overview, initialAttempt, lessonHref }: { overview: QuizOverview; initialAttempt: Attempt | null; lessonHref: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(initialAttempt);
  const [answers, setAnswers] = useState<Record<string, Given>>(() => fromAttempt(initialAttempt));
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const dirty = useRef(new Set<string>());
  const timer = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const submitting = useRef(false);

  const deadline = attempt?.deadlineAt ? Date.parse(attempt.deadlineAt) : null;
  const inProgress = attempt?.status === "IN_PROGRESS";

  const flush = async () => {
    if (!attempt || !dirty.current.size) return;
    const ids = [...dirty.current];
    dirty.current.clear();
    setSaveState("saving");
    const res = await saveAnswers(attempt.id, ids.map((id) => toAnswer(id, answersRef.current[id]!)));
    if (res.ok) setSaveState("saved");
    else {
      ids.forEach((id) => dirty.current.add(id));
      setSaveState("error");
      if (res.status === 409) setError(res.error.message);
    }
  };

  const submit = async () => {
    if (!attempt || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    if (timer.current) window.clearTimeout(timer.current);
    // Everything goes with the submission, so nothing depends on the last autosave having landed.
    const all = Object.entries(answersRef.current).map(([id, g]) => toAnswer(id, g));
    const res = await submitAttempt(attempt.id, all);
    submitting.current = false;
    setBusy(false);
    if (!res.ok) return setError(res.error.message);
    dirty.current.clear();
    setAttempt(res.data);
    setReviewing(false);
    window.scrollTo({ top: 0 });
    router.refresh();
  };

  // The countdown; the server enforces the deadline (+30 s grace) whatever this clock says.
  useEffect(() => {
    if (!inProgress || deadline === null) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) {
        window.clearInterval(id);
        void submit();
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `submit` reads refs; restarting the clock on every render would drift
  }, [inProgress, deadline]);

  // Last-chance save when the tab is hidden (phone lock, app switch).
  useEffect(() => {
    if (!inProgress) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `flush` reads refs
  }, [inProgress]);

  const update = (questionId: string, next: Given) => {
    const all = { ...answersRef.current, [questionId]: next };
    answersRef.current = all;
    setAnswers(all);
    dirty.current.add(questionId);
    setSaveState("idle");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), AUTOSAVE_MS);
  };

  const begin = async () => {
    setBusy(true);
    setError(null);
    const res = await startAttempt(overview.id);
    setBusy(false);
    if (!res.ok) return setError(res.error.message);
    answersRef.current = fromAttempt(res.data);
    setAnswers(answersRef.current);
    setAttempt(res.data);
    setNow(Date.now());
    setIndex(0);
  };

  // ───────────── before starting ─────────────
  if (!attempt) {
    const outOfAttempts = overview.attemptsLeft === 0;
    return (
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <h2 className="font-sans text-lg font-semibold">Before you start</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            {overview.questionCount} questions, {overview.totalPoints} points. You pass with {overview.passPercent}% or more.
          </li>
          {overview.timeLimitSeconds ? <li>You have {Math.round(overview.timeLimitSeconds / 60)} minutes. When time runs out, your saved answers are submitted automatically.</li> : <li>There is no time limit.</li>}
          <li>Answers save as you go — you can close the page and resume later.</li>
          <li>{overview.maxAttempts === null ? "You can retake the quiz as often as you like; your best score counts." : `You have ${overview.attemptsLeft} of ${overview.maxAttempts} attempts left; your best score counts.`}</li>
        </ul>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {outOfAttempts ? (
            <p className="text-sm text-muted-foreground">You&apos;ve used all your attempts.</p>
          ) : (
            <Button onClick={begin} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {overview.attemptsUsed ? "Start another attempt" : "Start quiz"}
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={lessonHref}>Not now</Link>
          </Button>
        </div>
      </section>
    );
  }

  // ───────────── results ─────────────
  if (attempt.status === "SUBMITTED" && attempt.result) {
    const r = attempt.result;
    const review = new Map((r.review ?? []).map((x) => [x.questionId, x]));
    return (
      <div className="grid gap-6">
        <Alert variant={r.passed ? "success" : "default"} role="status">
          {r.passed ? <CircleCheck /> : <CircleX />}
          <AlertTitle>
            {r.passed ? "Passed" : "Not passed yet"} — <span className="font-mono tabular">{r.scorePercent}%</span>
          </AlertTitle>
          <AlertDescription>
            {r.pointsAwarded} of {r.pointsPossible} points. {r.passed ? "This lesson is complete." : `You need ${r.passPercent}% to pass.`}
            {r.autoSubmitted ? " Time ran out, so your saved answers were submitted." : ""}
            {r.courseCompleted ? " You've completed the course!" : ` Course progress: ${r.coursePercent}%.`}
          </AlertDescription>
        </Alert>

        {r.review ? (
          <ol className="grid gap-4">
            {attempt.questions.map((q, i) => {
              const rv = review.get(q.id);
              const given = attempt.answers.find((a) => a.questionId === q.id);
              return (
                <li key={q.id} className="rounded-lg border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      <span className="mr-2 font-mono text-sm text-muted-foreground">{i + 1}.</span>
                      {q.prompt}
                    </p>
                    <span className={cn("inline-flex shrink-0 items-center gap-1 text-sm", rv?.correct ? "text-success" : "text-danger")}>
                      {rv?.correct ? <CircleCheck className="size-4" aria-hidden="true" /> : <CircleX className="size-4" aria-hidden="true" />}
                      {rv?.correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  {q.type === "NUMERIC" ? (
                    <p className="mt-3 text-sm">
                      Your answer: <span className="font-mono">{given?.numericValue ?? "—"}</span> · Correct: <span className="font-mono">{rv?.numericAnswer}</span>
                      {rv?.numericTolerance ? <span className="text-muted-foreground"> (± {rv.numericTolerance})</span> : null}
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-1.5 text-sm">
                      {q.options.map((o) => {
                        const correct = rv?.correctOptionIds.includes(o.id);
                        const chosen = given?.optionIds.includes(o.id);
                        return (
                          <li key={o.id} className={cn("flex items-center gap-2 rounded-sm border px-3 py-2", correct ? "border-success/50 bg-success/10" : chosen ? "border-danger/50 bg-danger/10" : "border-border")}>
                            {correct ? <CircleCheck className="size-4 text-success" aria-label="Correct answer" /> : chosen ? <CircleX className="size-4 text-danger" aria-label="Your answer" /> : <span className="size-4" />}
                            <span>{o.label}</span>
                            {chosen ? <span className="ml-auto text-xs text-muted-foreground">your answer</span> : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {rv?.explanation ? <p className="mt-3 border-l-2 border-cyan pl-3 text-sm text-muted-foreground">{rv.explanation}</p> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
            {overview.showAnswersAfter === "AFTER_PASS" ? "Correct answers are shown once you pass." : "This quiz doesn't show the correct answers."}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={lessonHref}>Back to the lesson</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ───────────── taking the quiz ─────────────
  const questions = attempt.questions;
  const q = questions[index]!;
  const given = answers[q.id];
  const answered = questions.filter((x) => isAnswered(answers[x.id])).length;
  const remaining = deadline !== null ? deadline - now : null;

  const status = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Attempt {attempt.attemptNumber} · <span className="font-mono tabular text-foreground">{answered}</span> of {questions.length} answered
      </span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground" aria-live="polite">
        {saveState === "saving" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
          </>
        ) : saveState === "error" ? (
          <>
            <CloudOff className="size-4 text-warning" aria-hidden="true" /> Not saved — retrying when you answer again
          </>
        ) : saveState === "saved" ? (
          <>
            <Cloud className="size-4" aria-hidden="true" /> Saved
          </>
        ) : null}
      </span>
      {remaining !== null ? (
        <span className={cn("inline-flex items-center gap-1.5 font-mono tabular", remaining < 60_000 ? "text-danger" : remaining < 300_000 ? "text-warning" : "")} role="timer" aria-label={`Time left ${clock(remaining)}`}>
          <Timer className="size-4" aria-hidden="true" /> {clock(remaining)}
        </span>
      ) : null}
    </div>
  );

  const navigator = (
    <nav aria-label="Questions" className="flex flex-wrap gap-2">
      {questions.map((x, i) => (
        <button
          key={x.id}
          type="button"
          onClick={() => {
            setReviewing(false);
            setIndex(i);
          }}
          aria-current={!reviewing && i === index ? "step" : undefined}
          aria-label={`Question ${i + 1}${isAnswered(answers[x.id]) ? ", answered" : ", not answered"}`}
          className={cn(
            "size-10 rounded-md border font-mono text-sm tabular transition-colors",
            !reviewing && i === index ? "border-cyan bg-surface-raised text-foreground" : isAnswered(answers[x.id]) ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-surface-raised",
          )}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );

  if (reviewing) {
    const unanswered = questions.length - answered;
    return (
      <div className="grid gap-5">
        {status}
        {navigator}
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-sans text-lg font-semibold">Ready to submit?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {unanswered ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered and will score 0. ` : "Every question has an answer. "}
            You can&apos;t change answers after submitting.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Submit answers
            </Button>
            <Button variant="outline" onClick={() => setReviewing(false)} disabled={busy}>
              Keep working
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {status}
      {navigator}
      <fieldset className="rounded-lg border border-border bg-surface p-6">
        <legend className="sr-only">Question {index + 1}</legend>
        <p className="font-mono text-xs text-muted-foreground">
          Question {index + 1} of {questions.length} · {q.points} {q.points === 1 ? "point" : "points"}
        </p>
        <p className="mt-2 text-lg leading-7 font-medium whitespace-pre-line">{q.prompt}</p>
        <p className="mt-1 text-sm text-muted-foreground">{typeHint[q.type]}</p>
        {q.type === "NUMERIC" ? (
          <div className="mt-4 grid max-w-xs gap-1.5">
            <label htmlFor={`n-${q.id}`} className="text-sm">
              Your answer
            </label>
            <input
              id={`n-${q.id}`}
              inputMode="decimal"
              autoComplete="off"
              value={given?.numericText ?? ""}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".");
                const value = raw.trim() === "" || !Number.isFinite(Number(raw)) ? null : Number(raw);
                update(q.id, { optionIds: [], numericValue: value, numericText: e.target.value });
              }}
              aria-invalid={given?.numericText && given.numericValue === null ? true : undefined}
              className="h-11 rounded-sm border border-input bg-background px-3 font-mono"
            />
            {given?.numericText && given.numericValue === null ? <p className="text-sm text-danger">Enter a number, e.g. 4.6</p> : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {q.options.map((o) => {
              const multi = q.type === "MULTI_CHOICE";
              const checked = given?.optionIds.includes(o.id) ?? false;
              return (
                <label key={o.id} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors", checked ? "border-cyan bg-surface-raised" : "border-border hover:bg-surface-raised")}>
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={`q-${q.id}`}
                    checked={checked}
                    onChange={() => {
                      const current = given?.optionIds ?? [];
                      const optionIds = multi ? (checked ? current.filter((id) => id !== o.id) : [...current, o.id]) : [o.id];
                      update(q.id, { optionIds, numericValue: null, numericText: "" });
                    }}
                    className="size-4 accent-[var(--accent-cyan)]"
                  />
                  <span>{o.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          <ArrowLeft aria-hidden="true" /> Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button
            variant="outline"
            onClick={() => {
              void flush();
              setIndex(index + 1);
            }}
          >
            Next <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              void flush();
              setReviewing(true);
            }}
          >
            Review &amp; submit
          </Button>
        )}
      </div>
    </div>
  );
}
