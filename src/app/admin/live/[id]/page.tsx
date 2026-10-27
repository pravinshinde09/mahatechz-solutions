import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { LiveStatusBadge, sessionTime } from "@/components/live/session-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { adminLiveSessionSchema } from "@/lib/contracts/live";
import { toIstInput } from "@/lib/format";
import { CancelForm, DeleteSessionButton, FollowUpForm, SessionForm } from "../live-forms";

export const metadata: Metadata = { title: "Live class" };

type Session = z.infer<typeof adminLiveSessionSchema>;

export default async function AdminLiveSessionPage(props: PageProps<"/admin/live/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "live.manage")) notFound();
  const { id } = await props.params;
  const search = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const res = await authedRequest<Session>(`/admin/live-sessions/${id}`);
  if (!res.ok) notFound();
  const s = res.data;
  const upcoming = s.status === "SCHEDULED" || s.status === "LIVE";

  return (
    <>
      <Link href="/admin/live" className="text-sm text-muted-foreground hover:text-foreground">
        ← Live classes
      </Link>
      <PageHeader title={s.title} description={`${s.course.title} · ${sessionTime(s)}`} actions={<LiveStatusBadge status={s.status} />} />
      {search.created ? (
        <Alert variant="success" className="mb-6">
          <CircleCheck />
          <AlertDescription>Scheduled. Enrolled students were notified, and reminders go out before the class.</AlertDescription>
        </Alert>
      ) : null}
      {s.status === "CANCELLED" ? (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>Cancelled{s.cancelReason ? `: ${s.cancelReason}` : "."}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          {s.status !== "CANCELLED" ? (
            <section aria-labelledby="schedule-heading" className="rounded-lg border border-border bg-surface p-6">
              <h2 id="schedule-heading" className="mb-4 font-sans text-xl font-semibold">
                Schedule
              </h2>
              <SessionForm
                mode="edit"
                sessionId={s.id}
                defaults={{
                  title: s.title,
                  description: s.description,
                  startsAt: toIstInput(s.startsAt),
                  durationMinutes: Math.round((Date.parse(s.endsAt) - Date.parse(s.startsAt)) / 60_000),
                  meetingProvider: s.meetingProvider,
                  meetingUrl: s.meetingUrl,
                  reminderOffsets: s.reminderOffsets,
                }}
              />
            </section>
          ) : null}
          <section aria-labelledby="followup-heading" className="rounded-lg border border-border bg-surface p-6">
            <h2 id="followup-heading" className="mb-1 font-sans text-xl font-semibold">
              After the class
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">Attach the recording and notes. Enrolled students are notified when a recording is added.</p>
            <FollowUpForm sessionId={s.id} defaults={{ notes: s.notes, recordingExternalUrl: s.recordingExternalUrl, hasHostedRecording: !!s.recordingAssetId, completed: s.status === "COMPLETED" }} />
          </section>
        </div>
        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-border bg-surface p-5 text-sm">
            <dl className="grid gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Join clicks</dt>
                <dd className="font-mono tabular">{s.joinClicks}</dd>
                <dd className="text-xs text-muted-foreground">Students who clicked Join — an activity signal, not verified attendance.</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Link released</dt>
                <dd>{new Date(s.joinOpensAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</dd>
              </div>
            </dl>
          </section>
          {upcoming ? (
            <section aria-labelledby="cancel-heading" className="rounded-lg border border-danger/30 bg-surface p-5">
              <h2 id="cancel-heading" className="mb-3 font-sans text-lg font-semibold">
                Cancel
              </h2>
              <CancelForm sessionId={s.id} />
            </section>
          ) : null}
          {s.joinClicks === 0 ? <DeleteSessionButton sessionId={s.id} /> : null}
        </aside>
      </div>
    </>
  );
}
