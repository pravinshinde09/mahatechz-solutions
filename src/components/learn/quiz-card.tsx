import { CircleCheck, ClipboardList, Timer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { QuizOverview } from "@/lib/contracts/assessment";
import { formatDateTime } from "@/lib/format";

const minutes = (s: number) => `${Math.round(s / 60)} min`;

/** The QUIZ lesson's stage: rules, best score and the way in (spec §22.2 "Assessments"). */
export function QuizCard({ quiz, href }: { quiz: QuizOverview; href: string }) {
  const outOfAttempts = quiz.attemptsLeft === 0 && !quiz.openAttemptId;
  const submitted = quiz.attempts.filter((a) => a.status === "SUBMITTED");
  return (
    <section aria-labelledby="quiz-heading" className="rounded-lg border border-border bg-surface p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-raised text-cyan" aria-hidden="true">
          <ClipboardList className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="quiz-heading" className="font-sans text-xl font-semibold">
            {quiz.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Answers are checked on the server when you submit. Your best attempt counts.</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Questions</dt>
          <dd className="font-mono tabular">
            {quiz.questionCount} · {quiz.totalPoints} pts
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pass mark</dt>
          <dd className="font-mono tabular">{quiz.passPercent}%</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Time limit</dt>
          <dd className="inline-flex items-center gap-1">
            {quiz.timeLimitSeconds ? (
              <>
                <Timer className="size-3.5 text-muted-foreground" aria-hidden="true" /> {minutes(quiz.timeLimitSeconds)}
              </>
            ) : (
              "None"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Attempts</dt>
          <dd className="font-mono tabular">{quiz.maxAttempts === null ? `${quiz.attemptsUsed} used · unlimited` : `${quiz.attemptsUsed} of ${quiz.maxAttempts}`}</dd>
        </div>
      </dl>

      {quiz.bestScorePercent !== null ? (
        <p className={`mt-5 inline-flex items-center gap-2 text-sm ${quiz.passed ? "text-success" : "text-muted-foreground"}`}>
          {quiz.passed ? <CircleCheck className="size-4" aria-hidden="true" /> : null}
          Best score <span className="font-mono font-semibold tabular">{quiz.bestScorePercent}%</span>
          {quiz.passed ? "— passed" : `— ${quiz.passPercent}% needed to pass`}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {quiz.viewer === "staff" ? (
          <p className="text-sm text-muted-foreground">Staff preview — attempts aren&apos;t recorded. Review the questions in the quiz builder.</p>
        ) : outOfAttempts ? (
          <p className="text-sm text-muted-foreground">You&apos;ve used all your attempts. Contact your instructor if you need another try.</p>
        ) : (
          <Button asChild>
            <Link href={href}>{quiz.openAttemptId ? "Resume quiz" : submitted.length ? "Try again" : "Start quiz"}</Link>
          </Button>
        )}
        {quiz.timeLimitSeconds && !quiz.openAttemptId && !outOfAttempts && quiz.viewer === "student" ? <span className="text-sm text-muted-foreground">The timer starts when you begin.</span> : null}
      </div>

      {submitted.length ? (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-medium">Your attempts</h3>
          <ul className="mt-2 grid gap-1 text-sm">
            {submitted.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2">
                <Link href={`${href}?attempt=${a.id}`} className="text-primary hover:underline">
                  Attempt {a.attemptNumber}
                </Link>
                <span className="text-muted-foreground">
                  <span className="font-mono tabular text-foreground">{a.scorePercent ?? 0}%</span> {a.passed ? "passed" : "not passed"} · {a.submittedAt ? formatDateTime(a.submittedAt) : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
