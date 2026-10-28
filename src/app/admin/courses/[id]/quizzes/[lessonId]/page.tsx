import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import { requireStaff } from "@/lib/auth/session";
import type { AdminQuiz } from "@/lib/contracts/assessment";
import { QuestionEditor, QuestionList, QuizSettingsForm } from "./quiz-builder";

export const metadata: Metadata = { title: "Quiz builder" };

/** Spec §17.1 #13: quiz builder for a QUIZ lesson (MVP-lite question types). */
export default async function QuizBuilderPage(props: PageProps<"/admin/courses/[id]/quizzes/[lessonId]">) {
  await requireStaff();
  const { id, lessonId } = await props.params;
  const res = await authedRequest<AdminQuiz>(`/admin/quizzes/${encodeURIComponent(lessonId)}`);
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) notFound();
    return <p role="alert" className="text-danger">{res.error.message}</p>;
  }
  const quiz = res.data;
  if (quiz.courseId !== id) notFound();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/courses/${id}/syllabus`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Syllabus
          </Link>
          <h2 className="mt-2 font-sans text-xl font-semibold">{quiz.lessonTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · {quiz.totalPoints} points · {quiz.lessonPublished ? "published" : "draft — publish it from the lesson page once it has questions"}
          </p>
        </div>
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Submitted attempts</dt>
            <dd className="font-mono tabular-nums">{quiz.stats.submittedAttempts}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pass rate</dt>
            <dd className="font-mono tabular-nums">{quiz.stats.passRate === null ? "—" : `${quiz.stats.passRate}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Average score</dt>
            <dd className="font-mono tabular-nums">{quiz.stats.averageScore === null ? "—" : `${quiz.stats.averageScore}%`}</dd>
          </div>
        </dl>
      </div>

      {quiz.attemptCount > 0 ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Students have taken this quiz. Changing questions affects future attempts only; past scores stay as graded.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <QuestionList courseId={id} quiz={quiz} />
          <section aria-labelledby="add-heading" className="rounded-lg border border-border bg-surface p-5">
            <h3 id="add-heading" className="mb-4 font-sans text-base font-semibold">
              Add a question
            </h3>
            <QuestionEditor key={quiz.questions.length} courseId={id} quizId={quiz.id} question={null} />
          </section>
        </div>
        <section aria-labelledby="settings-heading" className="rounded-lg border border-border bg-surface p-5 xl:self-start">
          <h3 id="settings-heading" className="mb-4 font-sans text-base font-semibold">
            Settings
          </h3>
          <QuizSettingsForm courseId={id} quiz={quiz} />
        </section>
      </div>
    </div>
  );
}
