"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextareaField } from "@/components/forms/textarea-field";
import { Uploader } from "@/components/media/uploader";
import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/lib/contracts/media";
import { idle, type FormState } from "@/lib/forms";
import { cancelLiveSessionAction, createLiveSessionAction, deleteLiveSessionAction, saveLiveFollowUpAction, updateLiveSessionAction } from "../learning-actions";

const providers = [
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "ZOOM", label: "Zoom" },
  { value: "MS_TEAMS", label: "Microsoft Teams" },
  { value: "OTHER", label: "Other (https link)" },
];
const reminderChoices = [
  { value: 1440, label: "24 hours before" },
  { value: 60, label: "1 hour before" },
  { value: 15, label: "15 minutes before" },
];

export interface SessionDefaults {
  courseId?: string;
  title?: string;
  description?: string | null;
  startsAt?: string;
  durationMinutes?: number;
  meetingProvider?: string;
  meetingUrl?: string;
  reminderOffsets?: number[];
}

/** Create (with a course picker) or edit a scheduled class. Times are entered in IST. */
export function SessionForm({ mode, sessionId, courses, defaults }: { mode: "create" | "edit"; sessionId?: string; courses?: { value: string; label: string }[]; defaults: SessionDefaults }) {
  const [state, action, pending] = useActionState(mode === "create" ? createLiveSessionAction : updateLiveSessionAction.bind(null, sessionId!), idle);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const reminders = defaults.reminderOffsets ?? [1440, 60];
  return (
    <ActionForm action={action} pending={pending} className="grid gap-5">
      <FormMessage state={state} />
      {mode === "create" && courses ? <SelectField name="courseId" label="Course" options={courses} defaultValue={v.courseId ?? defaults.courseId} error={e.courseId} hint="Only students enrolled in this course see the class." /> : null}
      <Field name="title" label="Title" required maxLength={160} defaultValue={v.title ?? defaults.title} error={e.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="startsAt" type="datetime-local" label="Starts (IST)" required defaultValue={v.startsAt ?? defaults.startsAt} error={e.startsAt} />
        <Field name="durationMinutes" type="number" label="Duration (minutes)" min={15} max={720} step={5} defaultValue={v.durationMinutes ?? String(defaults.durationMinutes ?? 60)} error={e.endsAt} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <SelectField name="meetingProvider" label="Platform" options={providers} defaultValue={v.meetingProvider ?? defaults.meetingProvider ?? "GOOGLE_MEET"} error={e.meetingProvider} />
        <Field name="meetingUrl" label="Meeting link" required placeholder="https://meet.google.com/abc-defg-hij" className="font-mono" defaultValue={v.meetingUrl ?? defaults.meetingUrl} error={e.meetingUrl} hint="Students only see it from 30 minutes before the start." />
      </div>
      <TextareaField name="description" label="Description (optional)" rows={3} maxLength={5000} defaultValue={v.description ?? defaults.description ?? ""} error={e.description} hint="Markdown supported." />
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Email reminders</legend>
        {reminderChoices.map((r) => (
          <label key={r.value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="reminder" value={r.value} defaultChecked={reminders.includes(r.value)} className="size-4 accent-[var(--primary)]" /> {r.label}
          </label>
        ))}
      </fieldset>
      <SubmitButton className="justify-self-start">{mode === "create" ? "Schedule class" : "Save changes"}</SubmitButton>
    </ActionForm>
  );
}

export function FollowUpForm({ sessionId, defaults }: { sessionId: string; defaults: { notes: string | null; recordingExternalUrl: string | null; hasHostedRecording: boolean; completed: boolean } }) {
  const [state, action, pending] = useActionState(saveLiveFollowUpAction.bind(null, sessionId), idle);
  const [video, setVideo] = useState<MediaAsset | null>(null);
  return (
    <ActionForm action={action} pending={pending} className="grid gap-5">
      <FormMessage state={state} />
      <div className="grid gap-2">
        <p className="text-sm font-medium">Recording</p>
        {defaults.hasHostedRecording && !video ? <p className="text-sm text-muted-foreground">An uploaded recording is attached. Upload another to replace it.</p> : null}
        {video ? (
          <>
            <input type="hidden" name="recordingAssetId" value={video.id} />
            <p className="text-sm text-success">Uploaded: {video.originalFilename} — save to attach it.</p>
          </>
        ) : (
          <Uploader purpose="LECTURE_VIDEO" label="Upload the recording" onUploaded={setVideo} />
        )}
        <Field id="recording-url" name="recordingExternalUrl" label="…or paste a link (YouTube, Vimeo, Google Drive)" className="font-mono" defaultValue={state.values?.recordingExternalUrl ?? defaults.recordingExternalUrl ?? ""} error={state.fieldErrors?.recordingExternalUrl} />
        {defaults.hasHostedRecording || defaults.recordingExternalUrl ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="clearRecording" className="size-4 accent-[var(--primary)]" /> Remove the current recording
          </label>
        ) : null}
      </div>
      <TextareaField id="live-notes" name="notes" label="Class notes (Markdown)" rows={6} maxLength={20000} defaultValue={state.values?.notes ?? defaults.notes ?? ""} error={state.fieldErrors?.notes} />
      {!defaults.completed ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="markCompleted" className="size-4 accent-[var(--primary)]" /> Mark the class as finished
        </label>
      ) : null}
      <SubmitButton className="justify-self-start">Save</SubmitButton>
    </ActionForm>
  );
}

export function CancelForm({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(cancelLiveSessionAction.bind(null, sessionId), idle);
  return (
    <ActionForm
      action={(form) => {
        if (!window.confirm("Cancel this class? Every enrolled student is emailed.")) return;
        action(form);
      }}
      pending={pending}
      className="grid gap-3"
    >
      <FormMessage state={state} />
      <Field id="cancel-reason" name="reason" label="Reason (sent to students)" required minLength={5} maxLength={500} error={state.fieldErrors?.reason} />
      <SubmitButton variant="destructive" size="sm" className="justify-self-start">
        Cancel class
      </SubmitButton>
    </ActionForm>
  );
}

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<FormState>(idle);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="justify-self-start text-danger"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("Delete this class permanently? Use Cancel instead if students may have planned for it.")) return;
          setBusy(true);
          setState(await deleteLiveSessionAction(sessionId));
          setBusy(false);
        }}
      >
        Delete class
      </Button>
      <FormMessage state={state} />
    </div>
  );
}
