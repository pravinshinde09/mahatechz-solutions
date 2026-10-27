import { Circle, CircleCheck, FileText, Link2, Lock, PlayCircle, Radio, SquarePen, ListChecks } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import type { LearnCourse, LessonState } from "@/lib/contracts/learning";
import { formatDate, formatDuration } from "@/lib/format";

const typeIcon = { VIDEO: PlayCircle, EXTERNAL_VIDEO: PlayCircle, ARTICLE: FileText, RESOURCE: Link2, QUIZ: ListChecks, ASSIGNMENT: SquarePen, LIVE_SESSION: Radio } as const;
const stateLabel: Record<LessonState, string> = { locked: "Locked", available: "Not started", in_progress: "In progress", completed: "Completed" };

/** Ring with the watched share — state is also given as text for screen readers (spec §21.2). */
function StateIcon({ state, percent }: { state: LessonState; percent: number }) {
  if (state === "completed") return <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />;
  if (state === "locked") return <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />;
  if (state === "in_progress") {
    const r = 7;
    const c = 2 * Math.PI * r;
    return (
      <svg viewBox="0 0 18 18" className="size-4 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(percent, 8) / 100)} strokeLinecap="round" />
      </svg>
    );
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />;
}

export function SyllabusNav({ course, currentLessonId }: { course: LearnCourse; currentLessonId: string | null }) {
  const slug = course.course.slug;
  return (
    <nav aria-label="Course syllabus" className="grid gap-2">
      {course.modules.map((m, i) => {
        const open = m.lessons.some((l) => l.id === currentLessonId) || (!currentLessonId && i === 0);
        return (
          <details key={m.id} open={open} className="group rounded-md border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-3">
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Module {i + 1}</span>
                <span className="block text-sm leading-5 font-semibold">{m.title}</span>
              </span>
              <span className="shrink-0 font-mono text-xs tabular text-muted-foreground" title="Required lessons completed">
                {m.completedRequiredCount}/{m.requiredCount}
              </span>
            </summary>
            <ol className="border-t border-border py-1">
              {m.lessons.map((l) => {
                const Icon = typeIcon[l.type];
                const current = l.id === currentLessonId;
                const body = (
                  <>
                    <StateIcon state={l.state} percent={l.percent} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 leading-5">{l.title}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="size-3.5" aria-hidden="true" />
                        {l.durationSeconds ? formatDuration(l.durationSeconds) : null}
                        {!l.isRequired ? <span>· Optional</span> : null}
                        {l.state === "locked" && l.availableAt ? <span>· Opens {formatDate(l.availableAt)}</span> : null}
                      </span>
                    </span>
                    <span className="sr-only">({stateLabel[l.state]})</span>
                  </>
                );
                return (
                  <li key={l.id}>
                    {l.state === "locked" ? (
                      <span className="flex items-start gap-3 px-3 py-2 text-sm text-muted-foreground" aria-disabled="true">
                        {body}
                      </span>
                    ) : (
                      <Link
                        href={`/app/learn/${slug}/${l.id}`}
                        aria-current={current ? "page" : undefined}
                        className={cn("flex items-start gap-3 px-3 py-2 text-sm hover:bg-surface-raised", current && "bg-surface-raised font-medium shadow-[inset_3px_0_0_var(--accent-cyan)]")}
                      >
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </nav>
  );
}
