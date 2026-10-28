"use client";

import { ArrowRight, CircleCheck, Clock, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { QuizOverview } from "@/lib/contracts/assessment";
import type { LessonContent, Playback, ProgressUpdate } from "@/lib/contracts/learning";
import { completeLesson, startLesson } from "@/lib/learn-client";
import { EmbedVideoPlayer, ExternalPlayer, FileVideoPlayer } from "./players";
import { QuizCard } from "./quiz-card";

interface Props {
  lesson: LessonContent;
  playback: Playback | null;
  quiz: QuizOverview | null;
  next: { href: string; title: string } | null;
}

const minutesLeft = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / 60_000));

/**
 * The lesson stage (spec §14.2): player or article, and the completion area. Progress is always
 * the server's answer — the client never sets a percentage.
 */
export function LessonStage({ lesson, playback, quiz, next }: Props) {
  const router = useRouter();
  const [watchSessionId, setWatchSessionId] = useState<string | null>(null);
  const [resumeAt, setResumeAt] = useState(playback?.resumeAt ?? lesson.progress.lastPositionSeconds);
  const [ready, setReady] = useState(!lesson.tracked);
  const [firstOpenedAt, setFirstOpenedAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(lesson.progress.state === "completed");
  const [celebrate, setCelebrate] = useState<{ courseCompleted: boolean } | null>(null);
  const [percent, setPercent] = useState(lesson.progress.percent);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lesson.tracked) return;
    let cancelled = false;
    void startLesson(lesson.id).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setWatchSessionId(res.data.watchSessionId);
        setResumeAt(res.data.resumeAt);
        setFirstOpenedAt(res.data.firstOpenedAt ? Date.parse(res.data.firstOpenedAt) : null);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.tracked]);

  // A coarse clock for the "available in N min" countdown on manual completion.
  useEffect(() => {
    if (completed || lesson.completion.mode !== "manual") return;
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [completed, lesson.completion.mode]);

  const onUpdate = (u: ProgressUpdate) => {
    setPercent(u.lessonPercent);
    if (u.completed) setCompleted(true);
    if (u.justCompleted) {
      setCelebrate({ courseCompleted: u.courseCompleted });
      router.refresh(); // syllabus ticks and module counts come from the server
    }
  };

  const markComplete = async () => {
    setSubmitting(true);
    setCompleteError(null);
    const res = await completeLesson(lesson.id);
    setSubmitting(false);
    if (!res.ok) return setCompleteError(res.error.message);
    onUpdate(res.data);
  };

  const eligibleAt = firstOpenedAt !== null ? firstOpenedAt + lesson.completion.minElapsedSeconds * 1000 : lesson.completion.eligibleAt ? Date.parse(lesson.completion.eligibleAt) : 0;
  const waiting = lesson.completion.mode === "manual" && eligibleAt > now;

  let stage: React.ReactNode;
  if (playback && (playback.kind === "file" || playback.kind === "hls")) {
    stage = ready ? <FileVideoPlayer key={playback.url} lessonId={lesson.id} title={lesson.title} url={playback.url} watchSessionId={watchSessionId} resumeAt={resumeAt} onUpdate={onUpdate} /> : <PlayerPlaceholder />;
  } else if (playback?.kind === "embed") {
    stage = ready ? <EmbedVideoPlayer lessonId={lesson.id} title={lesson.title} url={playback.url} watchSessionId={watchSessionId} resumeAt={resumeAt} onUpdate={onUpdate} /> : <PlayerPlaceholder />;
  } else if (playback?.kind === "external") {
    stage = <ExternalPlayer title={lesson.title} url={playback.url} />;
  } else if (lesson.articleHtml) {
    // Sanitised by the API before it reaches the browser.
    stage = <article className="prose-content rounded-lg border border-border bg-surface p-6 md:p-8" dangerouslySetInnerHTML={{ __html: lesson.articleHtml }} />;
  } else if (lesson.type === "VIDEO" || lesson.type === "LIVE_SESSION") {
    stage = <p className="rounded-lg border border-border bg-surface p-6 text-muted-foreground">The video for this lesson is still being prepared. Please check back soon.</p>;
  } else if (lesson.type === "QUIZ") {
    stage = quiz ? <QuizCard quiz={quiz} href={`/app/learn/${lesson.courseSlug}/quiz/${lesson.id}`} /> : <p className="rounded-lg border border-border bg-surface p-6 text-muted-foreground">This quiz isn&apos;t ready yet.</p>;
  } else if (lesson.type === "ASSIGNMENT") {
    stage = <p className="rounded-lg border border-border bg-surface p-6 text-muted-foreground">Assignments open soon. You can continue with the next lesson.</p>;
  } else {
    stage = <p className="rounded-lg border border-border bg-surface p-6 text-muted-foreground">Download the files for this lesson below.</p>;
  }

  return (
    <div className="grid gap-4">
      {stage}

      {celebrate ? (
        <Alert variant="success" role="status">
          <PartyPopper />
          <AlertTitle>{celebrate.courseCompleted ? "Course complete — congratulations!" : "Lesson complete"}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {celebrate.courseCompleted ? "You've finished every required lesson." : next ? `Up next: ${next.title}` : "You've reached the last lesson."}
            {next && !celebrate.courseCompleted ? (
              <Button asChild size="sm">
                <Link href={next.href}>
                  Next lesson <ArrowRight />
                </Link>
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {lesson.tracked ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
          {completed ? (
            <span className="inline-flex items-center gap-2 font-medium text-success">
              <CircleCheck className="size-4" aria-hidden="true" /> Completed
            </span>
          ) : lesson.completion.mode === "video" ? (
            <span className="text-muted-foreground">
              Completes automatically when you&apos;ve watched {lesson.completion.videoPercent}% — <span className="font-mono tabular text-foreground">{percent}%</span> so far.
            </span>
          ) : lesson.completion.mode === "manual" || lesson.completion.mode === "resource" ? (
            <>
              <Button size="sm" onClick={markComplete} disabled={waiting || submitting}>
                {submitting ? "Saving…" : "Mark as complete"}
              </Button>
              {waiting ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" aria-hidden="true" /> Available in about {minutesLeft(eligibleAt, now)} min
                </span>
              ) : null}
              {completeError ? (
                <span className="text-danger" role="alert">
                  {completeError}
                </span>
              ) : null}
            </>
          ) : lesson.completion.mode === "quiz" ? (
            <span className="text-muted-foreground">Completes when you pass the quiz{quiz ? ` (${quiz.passPercent}% or more)` : ""}.</span>
          ) : (
            <span className="text-muted-foreground">This lesson is marked complete by your instructor.</span>
          )}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">Staff preview — progress isn&apos;t recorded.</p>
      )}
    </div>
  );
}

function PlayerPlaceholder() {
  return <div className="aspect-video animate-pulse rounded-lg border border-border bg-surface-raised" aria-label="Loading player" />;
}
