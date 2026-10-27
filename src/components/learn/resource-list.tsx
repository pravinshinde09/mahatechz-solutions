import { Download, ExternalLink, FileArchive, FileText, Image as ImageIcon, Link2, Monitor } from "lucide-react";
import type { z } from "zod";
import type { learnResourceSchema } from "@/lib/contracts/learning";
import { formatDate } from "@/lib/format";

export type LearnResource = z.infer<typeof learnResourceSchema>;

const icons = { NOTE: FileText, PDF: FileText, IMAGE: ImageIcon, PRACTICE_FILE: FileArchive, ASSIGNMENT_SHEET: FileText, REFERENCE: FileText, LINK: Link2 } as const;
const typeLabel: Record<LearnResource["type"], string> = { NOTE: "Notes", PDF: "PDF", IMAGE: "Image", PRACTICE_FILE: "Practice file", ASSIGNMENT_SHEET: "Assignment sheet", REFERENCE: "Reference", LINK: "Link" };

export function formatBytes(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Downloads go through the authorised download route (spec §14.2 Resources tab). */
export function ResourceList({ resources, showContext = false }: { resources: LearnResource[]; showContext?: boolean }) {
  if (!resources.length) return <p className="text-sm text-muted-foreground">No files for this yet.</p>;
  return (
    <ul className="grid gap-2">
      {resources.map((r) => {
        const Icon = icons[r.type];
        const size = formatBytes(r.sizeBytes);
        return (
          <li key={r.assignmentId} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3">
            <Icon className="size-5 shrink-0 text-cyan" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-5 font-medium">{r.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[typeLabel[r.type], size, r.softwareVersion, showContext ? r.attachedTo : null, r.classDate ? `Class of ${formatDate(r.classDate)}` : null].filter(Boolean).join(" · ")}
              </p>
              {r.bestOnDesktop ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
                  <Monitor className="size-3.5" aria-hidden="true" /> Best opened on a desktop
                </p>
              ) : null}
            </div>
            <a
              href={`/api/resources/${r.resourceId}/download`}
              target={r.type === "LINK" ? "_blank" : undefined}
              rel={r.type === "LINK" ? "noopener noreferrer" : undefined}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-raised"
            >
              {r.type === "LINK" ? <ExternalLink className="size-4" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
              {r.type === "LINK" ? "Open" : "Download"}
              <span className="sr-only">{r.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
