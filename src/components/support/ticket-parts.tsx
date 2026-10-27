"use client";

import { Paperclip, X } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Uploader, type UploadActions } from "@/components/media/uploader";
import type { MediaAsset } from "@/lib/contracts/media";
import { attachmentUrlAction, completeAttachmentUploadAction, startAttachmentUploadAction } from "@/app/app/support/actions";

const actions: UploadActions = { start: startAttachmentUploadAction, complete: completeAttachmentUploadAction };

/** Up to 5 screenshots/PDFs; each finished upload becomes a hidden `attachmentId` field. */
export function AttachmentPicker() {
  const [files, setFiles] = useState<MediaAsset[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Attachments (optional)</p>
      {files.length ? (
        <ul className="grid gap-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-sm">
              <input type="hidden" name="attachmentId" value={f.id} />
              <Paperclip className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{f.originalFilename}</span>
              <button type="button" className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label={`Remove ${f.originalFilename}`} onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))}>
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {files.length < 5 ? (
        <Uploader
          key={uploaderKey}
          purpose="SUPPORT_ATTACHMENT"
          label="Attach a screenshot or PDF"
          actions={actions}
          onUploaded={(asset) => {
            setFiles((all) => [...all, asset]);
            setUploaderKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}

export function AttachmentLink({ ticketId, attachment, className }: { ticketId: string; attachment: { id: string; filename: string }; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={cn("inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-surface-raised", className)}
      onClick={async () => {
        setBusy(true);
        // Open the tab inside the click (popup blockers), then point it at the signed URL.
        const tab = window.open("about:blank", "_blank");
        if (tab) tab.opener = null;
        const url = await attachmentUrlAction(ticketId, attachment.id);
        setBusy(false);
        if (url && tab) tab.location.href = url;
        else {
          tab?.close();
          setFailed(true);
        }
      }}
    >
      <Paperclip className="size-3.5" aria-hidden="true" />
      {failed ? "Couldn't open — try again" : attachment.filename}
    </button>
  );
}
