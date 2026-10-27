import { CalendarPlus, CircleX, Radio, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import type { LiveSessionView } from "@/lib/contracts/live";
import { JoinButton } from "./join-button";

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export const sessionTime = (s: Pick<LiveSessionView, "startsAt" | "endsAt">) => `${dayFmt.format(new Date(s.startsAt))} · ${timeFmt.format(new Date(s.startsAt))}–${timeFmt.format(new Date(s.endsAt))} IST`;

const statusStyle = {
  SCHEDULED: { label: "Scheduled", icon: CalendarPlus, className: "border-border text-muted-foreground" },
  LIVE: { label: "Live now", icon: Radio, className: "border-danger/40 text-danger" },
  COMPLETED: { label: "Finished", icon: Video, className: "border-border text-muted-foreground" },
  CANCELLED: { label: "Cancelled", icon: CircleX, className: "border-warning/40 text-warning" },
} as const;

export function LiveStatusBadge({ status }: { status: LiveSessionView["status"] }) {
  const s = statusStyle[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", s.className)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function SessionCard({ session: s }: { session: LiveSessionView }) {
  const upcoming = s.status === "SCHEDULED" || s.status === "LIVE";
  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LiveStatusBadge status={s.status} />
          <span className="text-xs text-muted-foreground">{s.course.title}</span>
        </div>
        <h3 className="mt-2 leading-6 font-semibold">
          <Link href={`/app/live/${s.id}`} className="hover:text-primary">
            {s.title}
          </Link>
        </h3>
        <p className="mt-0.5 font-mono text-sm tabular text-muted-foreground">{sessionTime(s)}</p>
        {s.status === "CANCELLED" && s.cancelReason ? <p className="mt-1 text-sm text-warning">{s.cancelReason}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {upcoming ? (
          <>
            <JoinButton id={s.id} joinOpen={s.joinOpen} joinOpensAt={s.joinOpensAt} endsAt={s.endsAt} size="sm" />
            <a href={`/api/live/${s.id}/ics`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-raised">
              <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
            </a>
          </>
        ) : s.recording?.available ? (
          <Link href={`/app/live/${s.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-raised">
            <Video className="size-4" aria-hidden="true" /> Watch recording
          </Link>
        ) : null}
      </div>
    </article>
  );
}
