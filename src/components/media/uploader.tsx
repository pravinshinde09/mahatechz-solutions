"use client";

import { CircleAlert, CircleCheck, Pause, Play, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeUploadAction, renewUploadAction, startUploadAction } from "@/app/admin/media/actions";
import type { MediaAsset, MediaPurpose, UploadInstruction } from "@/lib/contracts/media";

const MB = 1024 * 1024;
// UX pre-checks only — the API enforces the real rules (spec §11.4).
const LIMITS: Partial<Record<MediaPurpose, { accept: string; maxBytes: number; hint: string }>> = {
  THUMBNAIL: { accept: ".jpg,.jpeg,.png,.webp", maxBytes: 5 * MB, hint: "JPG, PNG or WebP, 16:9, at least 1280×720, up to 5 MB" },
  LECTURE_VIDEO: { accept: ".mp4,.mov,.mkv,.webm", maxBytes: 4096 * MB, hint: "MP4 (H.264) preferred, up to 4 GB — uploads resume if the connection drops" },
  DOCUMENT: { accept: ".pdf,.jpg,.jpeg,.png,.webp", maxBytes: 50 * MB, hint: "PDF or image, up to 50 MB" },
  PRACTICE_FILE: { accept: ".dwg,.dxf,.rvt,.rfa,.zip", maxBytes: 200 * MB, hint: "DWG, DXF, RVT, RFA or ZIP, up to 200 MB" },
};

const MIME_BY_EXT: Record<string, string> = { mkv: "video/x-matroska", dwg: "application/octet-stream", dxf: "application/octet-stream", rvt: "application/octet-stream", rfa: "application/octet-stream" };
const mimeOf = (file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? (file.type || "application/octet-stream");
};

type State =
  | { phase: "idle" }
  | { phase: "uploading"; name: string; percent: number; paused: boolean; resumable: boolean }
  | { phase: "verifying"; name: string }
  | { phase: "done"; name: string }
  | { phase: "error"; message: string };

type Controller = { abort(): void; pause?(): void; resume?(): void };

function xhrSend(method: "PUT" | "POST", url: string, body: Document | XMLHttpRequestBodyInit, headers: Record<string, string>, onProgress: (p: number) => void) {
  const xhr = new XMLHttpRequest();
  const done = new Promise<string>((resolve, reject) => {
    xhr.open(method, url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.responseText) : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(body);
  });
  return { done, controller: { abort: () => xhr.abort() } satisfies Controller };
}

async function sendBytes(file: File, mediaAssetId: string, upload: UploadInstruction, onProgress: (p: number) => void, setController: (c: Controller) => void) {
  if (upload.protocol === "put") {
    const { done, controller } = xhrSend("PUT", upload.url, file, upload.headers, onProgress);
    setController(controller);
    await done;
    return undefined;
  }
  if (upload.protocol === "form") {
    const form = new FormData();
    for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
    form.append(upload.fileField, file);
    const { done, controller } = xhrSend("POST", upload.url, form, {}, onProgress);
    setController(controller);
    return JSON.parse(await done) as Record<string, unknown>;
  }
  // TUS (Bunny Stream): resumable, survives flaky networks; signature renewed if it expires.
  const { Upload: TusUpload } = await import("tus-js-client");
  let headers = upload.headers;
  await new Promise<void>((resolve, reject) => {
    const tus = new TusUpload(file, {
      endpoint: upload.endpoint,
      headers,
      metadata: upload.metadata,
      chunkSize: 50 * MB,
      retryDelays: [0, 3000, 10_000, 30_000, 60_000],
      onBeforeRequest: (req) => {
        for (const [k, v] of Object.entries(headers)) req.setHeader(k, v);
      },
      onShouldRetry: (err) => {
        const status = (err as { originalResponse?: { getStatus(): number } }).originalResponse?.getStatus() ?? 0;
        if (status === 401 || status === 403) {
          void renewUploadAction(mediaAssetId).then((renewed) => {
            if (renewed.ok && renewed.upload.protocol === "tus") headers = renewed.upload.headers;
          });
        }
        return status !== 400 && status !== 404;
      },
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
      onError: (err) => reject(err),
    });
    tus.findPreviousUploads().then((previous) => {
      if (previous[0]) tus.resumeFromPreviousUpload(previous[0]);
      tus.start();
    });
    setController({ abort: () => void tus.abort(true).finally(() => reject(new Error("Upload cancelled"))), pause: () => void tus.abort(false), resume: () => tus.start() });
  });
  return undefined;
}

/** Spec §21.6 UploadDropzone: pick or drop a file → progress → server verification. */
export function Uploader({
  purpose,
  title,
  label = "Upload a file",
  onUploaded,
}: {
  purpose: MediaPurpose;
  title?: string;
  label?: string;
  onUploaded: (asset: MediaAsset) => void | Promise<void>;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);
  const controller = useRef<Controller | null>(null);
  const inputId = useId();
  const limits = LIMITS[purpose];

  async function handle(file: File) {
    if (limits && file.size > limits.maxBytes) return setState({ phase: "error", message: `This file is larger than ${Math.round(limits.maxBytes / MB)} MB.` });
    setState({ phase: "uploading", name: file.name, percent: 0, paused: false, resumable: false });
    try {
      const start = await startUploadAction({ purpose, filename: file.name, mimeType: mimeOf(file), sizeBytes: file.size, ...(title ? { title } : {}) });
      if (!start.ok) throw new Error(start.message);
      const providerResult = await sendBytes(
        file,
        start.mediaAssetId,
        start.upload,
        (percent) => setState((s) => (s.phase === "uploading" ? { ...s, percent } : s)),
        (c) => {
          controller.current = c;
          setState((s) => (s.phase === "uploading" ? { ...s, resumable: Boolean(c.pause) } : s));
        },
      );
      setState({ phase: "verifying", name: file.name });
      const done = await completeUploadAction(start.mediaAssetId, providerResult);
      if (!done.ok) throw new Error(done.message);
      setState({ phase: "done", name: file.name });
      await onUploaded(done.asset);
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      controller.current = null;
    }
  }

  const busy = state.phase === "uploading" || state.phase === "verifying";
  return (
    <div className="grid gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && !busy) void handle(file);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-input bg-background/40 hover:bg-surface-raised"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <Upload className="size-5 text-cyan" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
        {limits ? <span className="text-xs text-muted-foreground">{limits.hint}</span> : null}
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept={limits?.accept}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handle(file);
          }}
        />
      </label>

      {state.phase === "uploading" ? (
        <div className="grid gap-2 rounded-md border border-border bg-surface p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{state.name}</span>
            <span className="font-mono tabular">{state.percent}%</span>
          </div>
          <div role="progressbar" aria-label={`Uploading ${state.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent} className="h-2 overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full bg-cyan transition-[width] duration-200" style={{ width: `${state.percent}%` }} />
          </div>
          <div className="flex gap-2">
            {state.resumable ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (state.paused) controller.current?.resume?.();
                  else controller.current?.pause?.();
                  setState({ ...state, paused: !state.paused });
                }}
              >
                {state.paused ? <Play /> : <Pause />} {state.paused ? "Resume" : "Pause"}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => controller.current?.abort()}>
              <X /> Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {state.phase === "verifying" ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Checking {state.name}…
        </p>
      ) : null}
      {state.phase === "done" ? (
        <p className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
          <CircleCheck className="size-4" aria-hidden="true" /> {state.name} uploaded.
        </p>
      ) : null}
      {state.phase === "error" ? (
        <p className="flex items-center gap-1.5 text-sm text-danger" role="alert">
          <CircleAlert className="size-4" aria-hidden="true" /> {state.message}
        </p>
      ) : null}
    </div>
  );
}
