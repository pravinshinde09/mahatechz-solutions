import { Lock } from "lucide-react";
import type { z } from "zod";
import { cn } from "cn";
import type { supportMessageSchema } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";
import { AttachmentLink } from "./ticket-parts";

type Message = z.infer<typeof supportMessageSchema>;

/** Conversation view shared by the student and staff pages; internal notes only reach staff. */
export function MessageThread({ ticketId, messages, viewer }: { ticketId: string; messages: Message[]; viewer: "student" | "staff" }) {
  return (
    <ol className="grid gap-3" aria-label="Messages">
      {messages.map((m) => {
        const fromStaff = !!m.author?.isStaff;
        const mine = viewer === "student" ? !fromStaff : fromStaff;
        return (
          <li
            key={m.id}
            className={cn(
              "rounded-lg border p-4",
              m.isInternalNote ? "border-dashed border-warning/50 bg-warning/5" : mine ? "border-primary/30 bg-primary/5 sm:ml-10" : "border-border bg-surface sm:mr-10",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {m.isInternalNote ? (
                  <span className="mr-2 inline-flex items-center gap-1 text-warning">
                    <Lock className="size-3.5" aria-hidden="true" /> Internal note
                  </span>
                ) : null}
                {viewer === "student" && fromStaff ? "Mahatecz support" : (m.author?.name ?? "Deleted user")}
                {viewer === "staff" && fromStaff && !m.isInternalNote ? " (staff)" : ""}
              </span>
              <time dateTime={m.createdAt}>{formatDateTime(m.createdAt)}</time>
            </div>
            <p className="text-sm leading-6 whitespace-pre-wrap">{m.body}</p>
            {m.attachments.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <AttachmentLink key={a.id} ticketId={ticketId} attachment={a} />
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
