import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SessionCard } from "@/components/live/session-card";
import { authedRequest } from "@/lib/api/server";
import type { LiveSessionView } from "@/lib/contracts/live";

export const metadata: Metadata = { title: "Live classes" };

export default async function LiveClassesPage(props: PageProps<"/app/live">) {
  const search = await props.searchParams;
  // Reminder emails and notifications link to ?session=<id>.
  if (typeof search.session === "string" && /^[0-9a-f-]{36}$/i.test(search.session)) redirect(`/app/live/${search.session}`);
  const when = search.when === "past" ? "past" : "upcoming";
  const res = await authedRequest<LiveSessionView[]>(`/me/live-sessions?when=${when}`);
  const sessions = res.ok ? res.data : [];

  return (
    <>
      <PageHeader title="Live classes" description="The join link appears here 30 minutes before each class starts." />
      <nav aria-label="Live classes" className="mb-6 flex gap-1 rounded-md border border-border p-1 sm:w-fit">
        {(["upcoming", "past"] as const).map((w) => (
          <Link key={w} href={w === "past" ? "/app/live?when=past" : "/app/live"} aria-current={when === w ? "page" : undefined} className={cn("flex-1 rounded px-4 py-1.5 text-center text-sm", when === w ? "bg-surface-raised font-medium" : "text-muted-foreground hover:text-foreground")}>
            {w === "upcoming" ? "Upcoming" : "Past & recordings"}
          </Link>
        ))}
      </nav>
      {!res.ok ? (
        <p className="text-danger">{res.error.message}</p>
      ) : sessions.length ? (
        <ul className="grid gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <SessionCard session={s} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={when === "upcoming" ? "No live classes scheduled" : "No past classes yet"}
          description={when === "upcoming" ? "When your instructors schedule a class for one of your courses, it appears here and you get an email reminder." : "Recordings and notes of finished classes appear here."}
        />
      )}
    </>
  );
}
