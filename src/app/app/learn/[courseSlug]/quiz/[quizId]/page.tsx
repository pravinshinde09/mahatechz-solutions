import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { authedRequest } from "@/lib/api/server";
import type { Attempt, QuizOverview } from "@/lib/contracts/assessment";
import { NoAccess } from "../../no-access";
import { QuizRunner } from "./quiz-runner";

export const metadata: Metadata = { title: "Quiz" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Spec §22.2 "Assessments": navigator, timer, autosave, review screen, results. */
export default async function QuizPage(props: PageProps<"/app/learn/[courseSlug]/quiz/[quizId]">) {
  const { courseSlug, quizId } = await props.params;
  const search = await props.searchParams;
  if (!UUID.test(quizId)) return <NoAccess error={{ code: "NOT_FOUND", message: "" }} courseSlug={courseSlug} />;

  const overviewRes = await authedRequest<QuizOverview>(`/quizzes/${quizId}`);
  if (!overviewRes.ok) return <NoAccess error={overviewRes.error} courseSlug={courseSlug} />;
  const overview = overviewRes.data;
  const lessonHref = `/app/learn/${overview.courseSlug}/${quizId}`;

  // A past attempt to review, else the open one to resume.
  const reviewId = typeof search.attempt === "string" && UUID.test(search.attempt) ? search.attempt : null;
  const attemptId = reviewId ?? overview.openAttemptId;
  const attemptRes = attemptId ? await authedRequest<Attempt>(`/quiz-attempts/${attemptId}`) : null;
  const attempt = attemptRes?.ok ? attemptRes.data : null;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href={lessonHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to the lesson
      </Link>
      <header>
        <p className="text-sm text-muted-foreground">Quiz</p>
        <h1 className="mt-1 font-sans text-2xl leading-8 font-semibold md:text-3xl md:leading-9">{overview.title}</h1>
      </header>
      {overview.viewer === "staff" ? (
        <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">Staff preview — attempts aren&apos;t recorded. Review the questions in the admin quiz builder.</p>
      ) : (
        <QuizRunner key={attempt?.id ?? "new"} overview={overview} initialAttempt={attempt} lessonHref={lessonHref} />
      )}
    </div>
  );
}
