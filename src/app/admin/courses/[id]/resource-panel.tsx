"use client";

import { ExternalLink, FileText, Paperclip, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Uploader } from "@/components/media/uploader";
import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/lib/contracts/media";
import { idle } from "@/lib/forms";
import { formatDate } from "@/lib/format";
import { addResourceAction, detachResourceAction } from "../actions";

export interface CourseResource {
  assignmentId: string;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  classDate: string | null;
  resource: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    softwareVersion: string | null;
    isPublicPreview: boolean;
    file: { originalFilename: string | null; sizeBytes: number | null } | null;
  };
}

type Target = { courseId: string } | { moduleId: string } | { lessonId: string };

const sizeLabel = (bytes: number | null) => (bytes === null ? "" : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function ResourcePanel({ courseId, target, resources, withClassDate = false }: { courseId: string; target: Target; resources: CourseResource[]; withClassDate?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-6">
      {resources.length ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {resources.map((r) => (
            <li key={r.assignmentId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              {r.resource.type === "LINK" ? <ExternalLink className="size-4 text-muted-foreground" aria-hidden="true" /> : <FileText className="size-4 text-muted-foreground" aria-hidden="true" />}
              <span className="min-w-0 flex-1">
                <span className="font-medium">{r.resource.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.resource.file?.originalFilename ?? r.resource.url}
                  {r.resource.file ? ` · ${sizeLabel(r.resource.file.sizeBytes)}` : ""}
                  {r.resource.softwareVersion ? ` · ${r.resource.softwareVersion}` : ""}
                </span>
              </span>
              {r.classDate ? <span className="font-mono text-xs text-muted-foreground">{formatDate(r.classDate)}</span> : null}
              {r.resource.isPublicPreview ? <span className="rounded-full border border-cyan/40 px-2 py-0.5 text-xs text-cyan">Public</span> : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${r.resource.title}`}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await detachResourceAction(courseId, r.resource.id, r.assignmentId);
                    setError(result.status === "error" ? (result.message ?? "Couldn't remove it.") : null);
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip className="size-4" aria-hidden="true" /> No resources attached yet.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <AddResourceForm courseId={courseId} target={target} withClassDate={withClassDate} />
    </div>
  );
}

function AddResourceForm({ courseId, target, withClassDate }: { courseId: string; target: Target; withClassDate: boolean }) {
  // Explicit ids: the lesson editor on the same page also has "title" and "type" fields.
  const ids = { title: "resource-title", type: "resource-type", url: "resource-url", version: "resource-version", date: "resource-class-date" };
  const [state, action, pending] = useActionState(addResourceAction.bind(null, courseId, target), idle);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<MediaAsset | null>(null);
  const [purpose, setPurpose] = useState<"DOCUMENT" | "PRACTICE_FILE">("DOCUMENT");
  const errors = state.fieldErrors ?? {};
  return (
    <ActionForm key={state.status === "success" ? state.message : "add"} action={action} pending={pending} className="grid gap-4 rounded-md border border-dashed border-border p-4">
      <p className="text-sm font-medium">Add a resource</p>
      <FormMessage state={state} />
      <div className="flex gap-2" role="radiogroup" aria-label="Resource source">
        {(["file", "link"] as const).map((m) => (
          <Button key={m} type="button" size="sm" variant={mode === m ? "default" : "outline"} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === "file" ? "Upload a file" : "Add a link"}
          </Button>
        ))}
      </div>
      <Field id={ids.title} name="title" label="Resource title" required maxLength={200} error={errors.title} />
      {mode === "file" ? (
        <>
          <SelectField
            id={ids.type}
            name="type"
            label="Kind"
            defaultValue="PDF"
            onChange={(v) => setPurpose(v === "PRACTICE_FILE" ? "PRACTICE_FILE" : "DOCUMENT")}
            options={[
              { value: "PDF", label: "PDF / notes" },
              { value: "NOTE", label: "Class notes" },
              { value: "PRACTICE_FILE", label: "Practice drawing (DWG, DXF, RVT, RFA, ZIP)" },
              { value: "ASSIGNMENT_SHEET", label: "Assignment sheet" },
              { value: "IMAGE", label: "Image" },
            ]}
          />
          <input type="hidden" name="mediaAssetId" value={file?.id ?? ""} />
          {file ? <p className="text-sm text-success">Attached: {file.originalFilename}</p> : <Uploader key={purpose} purpose={purpose} onUploaded={setFile} />}
          {errors.file || errors.mediaAssetId ? <p className="text-sm text-danger">{errors.file ?? errors.mediaAssetId}</p> : null}
          <Field id={ids.version} name="softwareVersion" label="Software version (optional)" placeholder="AutoCAD Electrical 2025" maxLength={80} />
        </>
      ) : (
        <Field id={ids.url} name="url" label="Link" type="url" placeholder="https://…" error={errors.url ?? errors.file} />
      )}
      {withClassDate ? <Field id={ids.date} name="classDate" label="Class date (for daily notes, optional)" type="date" error={errors.classDate} /> : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublicPreview" className="size-4 accent-[var(--primary)]" />
        Public preview — downloadable without enrolling
      </label>
      <SubmitButton size="default" className="justify-self-start">
        Attach resource
      </SubmitButton>
    </ActionForm>
  );
}
