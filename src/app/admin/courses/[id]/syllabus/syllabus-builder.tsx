"use client";

import { ArrowDown, ArrowUp, FileText, Link2, Paperclip, Pencil, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useOptimistic, useState, useTransition } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { idle, type FormState } from "@/lib/forms";
import { formatDuration } from "@/lib/format";
import { addLessonAction, addModuleAction, deleteModuleAction, renameModuleAction, reorderLessonsAction, reorderModulesAction, updateModuleAction } from "../../actions";

type Module = AdminCourse["modules"][number];

const lessonTypes = [
  { value: "VIDEO", label: "Uploaded video", icon: PlayCircle },
  { value: "EXTERNAL_VIDEO", label: "Video link (YouTube, Vimeo, Drive)", icon: Link2 },
  { value: "ARTICLE", label: "Article", icon: FileText },
  { value: "RESOURCE", label: "Resource / notes", icon: Paperclip },
] as const;
const iconFor = (type: string) => lessonTypes.find((t) => t.value === type)?.icon ?? FileText;

const swap = <T,>(items: T[], i: number, j: number) => {
  const next = [...items];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
};

export function SyllabusBuilder({ courseId, modules }: { courseId: string; modules: Module[] }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<FormState>(idle);
  const run = (fn: () => Promise<FormState>) =>
    startTransition(async () => {
      const result = await fn();
      setNotice(result.status === "error" ? result : idle);
    });
  const [addState, addModule] = useActionState(addModuleAction.bind(null, courseId), idle);

  return (
    <div className="grid gap-6">
      <FormMessage state={notice} />
      {modules.length === 0 ? (
        <EmptyState title="No modules yet" description="Modules group lessons into sections, e.g. “Getting started” or “Panel layouts”." />
      ) : (
        <ol className="grid gap-4" aria-busy={pending}>
          {modules.map((m, i) => (
            <li key={m.id} className="rounded-lg border border-border bg-surface">
              <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
                <ModuleTitle courseId={courseId} module={m} />
                <PublishToggle published={m.isPublished} label={`Publish ${m.title}`} onToggle={(next) => updateModuleAction(courseId, m.id, { isPublished: next })} onError={setNotice} />
                <div className="flex gap-1">
                  <IconButton label={`Move ${m.title} up`} disabled={pending || i === 0} onClick={() => run(() => reorderModulesAction(courseId, swap(modules.map((x) => x.id), i, i - 1)))}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton label={`Move ${m.title} down`} disabled={pending || i === modules.length - 1} onClick={() => run(() => reorderModulesAction(courseId, swap(modules.map((x) => x.id), i, i + 1)))}>
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    label={`Delete ${m.title}`}
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Delete “${m.title}” and its ${m.lessons.length} lessons? If students are enrolled it is archived instead.`)) run(() => deleteModuleAction(courseId, m.id));
                    }}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              </div>

              {m.lessons.length ? (
                <ol className="divide-y divide-border">
                  {m.lessons.map((l, j) => {
                    const Icon = iconFor(l.type);
                    return (
                      <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <Link href={`/admin/courses/${courseId}/lessons/${l.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-primary hover:underline">
                          {l.title}
                        </Link>
                        <span className="flex items-center gap-2 text-xs">
                          {l.isPreview ? <span className="rounded-full border border-cyan/40 px-2 py-0.5 text-cyan">Preview</span> : null}
                          <span className={`rounded-full border px-2 py-0.5 ${l.isPublished ? "border-success/40 text-success" : "border-border text-muted-foreground"}`}>
                            {l.isPublished ? "Published" : "Draft"}
                          </span>
                          {l.type === "VIDEO" && l.video && l.video.status !== "READY" ? (
                            <span className="rounded-full border border-warning/40 px-2 py-0.5 text-warning">Video {l.video.status.toLowerCase()}</span>
                          ) : null}
                          <span className="w-16 text-right font-mono text-muted-foreground tabular">{formatDuration(l.durationSeconds)}</span>
                        </span>
                        <div className="flex gap-1">
                          <IconButton label={`Move ${l.title} up`} disabled={pending || j === 0} onClick={() => run(() => reorderLessonsAction(courseId, m.id, swap(m.lessons.map((x) => x.id), j, j - 1)))}>
                            <ArrowUp />
                          </IconButton>
                          <IconButton
                            label={`Move ${l.title} down`}
                            disabled={pending || j === m.lessons.length - 1}
                            onClick={() => run(() => reorderLessonsAction(courseId, m.id, swap(m.lessons.map((x) => x.id), j, j + 1)))}
                          >
                            <ArrowDown />
                          </IconButton>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">No lessons in this module yet.</p>
              )}
              <AddLesson courseId={courseId} moduleId={m.id} />
            </li>
          ))}
        </ol>
      )}

      <form action={addModule} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
        <label className="grid min-w-64 flex-1 gap-1.5 text-sm">
          <span className="font-medium">New module</span>
          <input name="title" required minLength={2} maxLength={160} placeholder="e.g. Panel layout drawings" className="h-11 rounded-sm border border-input bg-surface px-3 text-base" />
        </label>
        <SubmitButton size="default">Add module</SubmitButton>
        {addState.status === "error" ? (
          <p role="alert" className="w-full text-sm text-danger">
            {addState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function ModuleTitle({ courseId, module }: { courseId: string; module: Module }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(async (prev: FormState, form: FormData) => {
    const result = await renameModuleAction(courseId, module.id, prev, form);
    if (result.status === "success") setEditing(false);
    return result;
  }, idle);
  if (!editing) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold">{module.title}</span>
        <IconButton label={`Rename ${module.title}`} onClick={() => setEditing(true)}>
          <Pencil />
        </IconButton>
      </span>
    );
  }
  return (
    <form action={action} className="flex min-w-0 flex-1 items-center gap-2">
      <input name="title" defaultValue={module.title} aria-label="Module title" autoFocus required minLength={2} className="h-9 min-w-0 flex-1 rounded-sm border border-input bg-background px-2" />
      <SubmitButton size="sm">Save</SubmitButton>
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      {state.status === "error" ? <span className="text-sm text-danger">{state.message}</span> : null}
    </form>
  );
}

function AddLesson({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const [state, action] = useActionState(addLessonAction.bind(null, courseId, moduleId), idle);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t border-border bg-background/40 px-4 py-3">
      <input name="title" required minLength={2} maxLength={160} placeholder="New lesson title" aria-label="New lesson title" className="h-10 min-w-48 flex-1 rounded-sm border border-input bg-surface px-3 text-sm" />
      <select name="type" aria-label="Lesson type" className="h-10 rounded-sm border border-input bg-surface px-2 text-sm">
        {lessonTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <SubmitButton size="sm" variant="outline">
        Add lesson
      </SubmitButton>
      {state.status === "error" ? <span className="w-full text-sm text-danger">{state.message}</span> : null}
    </form>
  );
}

/** Flips immediately (optimistic) and settles when the server confirms or rejects. */
function PublishToggle({ published, label, onToggle, onError }: { published: boolean; label: string; onToggle: (next: boolean) => Promise<FormState>; onError: (s: FormState) => void }) {
  const [optimistic, setOptimistic] = useOptimistic(published);
  const [pending, startTransition] = useTransition();
  return (
    <label className="ml-auto flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        aria-label={label}
        checked={optimistic}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setOptimistic(next);
            const result = await onToggle(next);
            onError(result.status === "error" ? result : idle);
          });
        }}
        className="size-4 accent-[var(--primary)]"
      />
      Published
    </label>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
}
