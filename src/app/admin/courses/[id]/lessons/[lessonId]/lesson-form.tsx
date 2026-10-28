"use client";

import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { Uploader } from "@/components/media/uploader";
import { Button } from "@/components/ui/button";
import { refreshVideoStatusAction } from "@/app/admin/media/actions";
import type { AdminLesson } from "@/lib/contracts/catalog";
import { idle } from "@/lib/forms";
import { formatDuration } from "@/lib/format";
import { deleteLessonAction, updateLessonAction } from "../../../actions";

const types = [
  { value: "VIDEO", label: "Uploaded video" },
  { value: "EXTERNAL_VIDEO", label: "Video link (YouTube, Vimeo, Google Drive, Bunny)" },
  { value: "ARTICLE", label: "Article" },
  { value: "RESOURCE", label: "Resource / notes only" },
  { value: "QUIZ", label: "Quiz (server-graded)" },
];

type VideoInfo = { id: string; status: string; title: string | null; durationSeconds: number | null };

export function LessonForm({ courseId, moduleId, lesson }: { courseId: string; moduleId: string; lesson: AdminLesson }) {
  const [state, action, pending] = useActionState(updateLessonAction.bind(null, courseId, moduleId, lesson.id), idle);
  const [type, setType] = useState<string>(lesson.type);
  const [video, setVideo] = useState<VideoInfo | null>(lesson.video);
  const [duration, setDuration] = useState(lesson.durationSeconds ? String(Math.round(lesson.durationSeconds / 60)) : "");
  const [checking, startCheck] = useTransition();
  const errors = state.fieldErrors ?? {};

  return (
    <ActionForm action={action} pending={pending} className="grid gap-6">
      <FormMessage state={state} />
      <Field name="title" label="Lesson title" required maxLength={160} defaultValue={lesson.title} error={errors.title} />
      <SelectField name="type" label="Lesson type" options={types} defaultValue={lesson.type} error={errors.type} onChange={setType} />

      {type === "VIDEO" ? (
        <div className="grid gap-3 rounded-md border border-border p-4">
          <input type="hidden" name="videoAssetId" value={video?.id ?? ""} />
          <p className="text-sm font-medium">Lecture video</p>
          {video ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="truncate">{video.title ?? "Uploaded video"}</span>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${video.status === "READY" ? "border-success/40 text-success" : "border-warning/40 text-warning"}`}>
                {video.status === "READY" ? "Ready" : video.status.toLowerCase()}
              </span>
              {video.durationSeconds ? <span className="font-mono text-xs text-muted-foreground">{formatDuration(video.durationSeconds)}</span> : null}
              {video.status !== "READY" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={checking}
                  onClick={() =>
                    startCheck(async () => {
                      const fresh = await refreshVideoStatusAction(video.id);
                      if (fresh) setVideo({ id: fresh.id, status: fresh.status, title: fresh.title, durationSeconds: fresh.durationSeconds });
                    })
                  }
                >
                  {checking ? <Loader2 className="motion-safe:animate-spin" /> : <RefreshCw />} Check status
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No video attached yet.</p>
          )}
          <Uploader
            purpose="LECTURE_VIDEO"
            title={lesson.title}
            label={video ? "Replace video" : "Upload lecture video"}
            onUploaded={(asset) => {
              setVideo({ id: asset.id, status: asset.status, title: asset.title, durationSeconds: asset.durationSeconds });
              if (asset.durationSeconds && !duration) setDuration(String(Math.round(asset.durationSeconds / 60)));
            }}
          />
          <p className="text-xs text-muted-foreground">After uploading, save the lesson to attach the video. Processing can take a few minutes for long lectures.</p>
          {errors.videoAssetId ? <p className="text-sm text-danger">{errors.videoAssetId}</p> : null}
        </div>
      ) : null}

      {type === "EXTERNAL_VIDEO" ? (
        <Field
          name="externalVideoUrl"
          label="Video link"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=…"
          defaultValue={lesson.externalVideoUrl ?? ""}
          error={errors.externalVideoUrl}
          hint="Unlisted YouTube links are visible to anyone who has them — use them only for free or preview content."
        />
      ) : null}

      {type === "QUIZ" ? (
        <p className="rounded-md border border-border bg-background/40 px-4 py-3 text-sm">
          {lesson.type === "QUIZ" ? (
            <Link href={`/admin/courses/${courseId}/quizzes/${lesson.id}`} className="font-medium text-primary hover:underline">
              Edit questions and quiz settings →
            </Link>
          ) : (
            "Save the lesson as a quiz, then add its questions. It can be published once it has at least one question."
          )}
        </p>
      ) : null}

      {type === "ARTICLE" ? (
        <TextareaField name="articleBody" label="Article (Markdown)" rows={14} maxLength={100_000} defaultValue={lesson.articleBody ?? ""} error={errors.articleBody} hint="Headings, lists, links, code and tables are supported. HTML is removed." />
      ) : null}

      <TextareaField name="description" label="Summary (optional)" rows={3} maxLength={5000} defaultValue={lesson.description ?? ""} error={errors.description} />
      <Field
        name="durationMinutes"
        label="Duration (minutes)"
        inputMode="decimal"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        error={errors.durationMinutes ?? errors.durationSeconds}
        hint="Filled from the video when available; used for course totals."
      />

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">Visibility</legend>
        <Check name="isPublished" defaultChecked={lesson.isPublished} label="Published" hint="Visible to enrolled students (the module must be published too)." error={errors.isPublished} />
        <Check name="isPreview" defaultChecked={lesson.isPreview} label="Free preview" hint="Anyone can watch it from the course page." />
        <Check name="isRequired" defaultChecked={lesson.isRequired} label="Required for completion" hint="Counts towards course progress and certificates." />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save lesson</SubmitButton>
        <Button
          type="button"
          variant="ghost"
          className="text-danger"
          onClick={async () => {
            if (window.confirm("Delete this lesson? If students are enrolled it is archived instead.")) await deleteLessonAction(courseId, moduleId, lesson.id);
          }}
        >
          Delete lesson
        </Button>
      </div>
    </ActionForm>
  );
}

function Check({ name, label, hint, defaultChecked, error }: { name: string; label: string; hint: string; defaultChecked: boolean; error?: string | undefined }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
      <span>
        <span className="text-sm font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
        {error ? <span className="block text-sm text-danger">{error}</span> : null}
      </span>
    </label>
  );
}
