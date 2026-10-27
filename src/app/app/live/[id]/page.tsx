import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveStatusBadge, sessionTime } from "@/components/live/session-card";
import { JoinButton } from "@/components/live/join-button";
import { authedRequest } from "@/lib/api/server";
import type { LiveSessionView } from "@/lib/contracts/live";

export const metadata: Metadata = { title: "Live class" };

const providerName = { GOOGLE_MEET: "Google Meet", ZOOM: "Zoom", MS_TEAMS: "Microsoft Teams", OTHER: "the meeting app" } as const;

export default async function LiveClassPage(props: PageProps<"/app/live/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const res = await authedRequest<LiveSessionView>(`/live-sessions/${id}`);
  if (!res.ok) notFound();
  const s = res.data;
  const upcoming = s.status === "SCHEDULED" || s.status === "LIVE";
  const recording = s.recording?.available ? await authedRequest<{ kind: string; url: string }>(`/live-sessions/${id}/recording`) : null;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href="/app/live" className="text-sm text-muted-foreground hover:text-foreground">
        ← Live classes
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <LiveStatusBadge status={s.status} />
          <span className="text-sm text-muted-foreground">{s.course.title}{s.module ? ` · ${s.module.title}` : ""}</span>
        </div>
        <h1 className="mt-3 font-sans text-3xl leading-9 font-semibold">{s.title}</h1>
        <p className="mt-2 font-mono text-sm tabular text-muted-foreground">{sessionTime(s)}</p>
        {s.host ? <p className="mt-1 text-sm text-muted-foreground">With {s.host}</p> : null}
      </header>

      {s.status === "CANCELLED" ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">This class was cancelled{s.cancelReason ? `: ${s.cancelReason}` : "."}</p>
      ) : null}

      {upcoming ? (
        <section className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4">
          <JoinButton id={s.id} joinOpen={s.joinOpen} joinOpensAt={s.joinOpensAt} endsAt={s.endsAt} />
          <a href={`/api/live/${s.id}/ics`} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-raised">
            <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
          </a>
          <p className="basis-full text-xs text-muted-foreground">The class runs on {providerName[s.meetingProvider]}. The link opens 30 minutes before the start.</p>
        </section>
      ) : null}

      {recording?.ok ? (
        <section aria-labelledby="recording-heading" className="grid gap-3">
          <h2 id="recording-heading" className="font-sans text-xl font-semibold">
            Recording
          </h2>
          {recording.data.kind === "file" ? (
            <video src={recording.data.url} controls controlsList="nodownload" preload="metadata" playsInline className="aspect-video w-full rounded-lg border border-border bg-black">
              <track kind="captions" />
            </video>
          ) : (
            <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
              <iframe src={recording.data.url} title={`Recording: ${s.title}`} className="size-full" sandbox="allow-scripts allow-same-origin allow-presentation" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          )}
        </section>
      ) : !upcoming && s.status !== "CANCELLED" ? (
        <p className="text-sm text-muted-foreground">The recording will appear here once your instructor uploads it.</p>
      ) : null}

      {s.descriptionHtml ? (
        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-2 font-sans text-xl font-semibold">
            About this class
          </h2>
          <div className="prose-content text-sm" dangerouslySetInnerHTML={{ __html: s.descriptionHtml }} />
        </section>
      ) : null}

      {s.notesHtml ? (
        <section aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="mb-2 font-sans text-xl font-semibold">
            Class notes
          </h2>
          <div className="prose-content rounded-md border border-border bg-surface p-5 text-sm" dangerouslySetInnerHTML={{ __html: s.notesHtml }} />
        </section>
      ) : null}
    </div>
  );
}
