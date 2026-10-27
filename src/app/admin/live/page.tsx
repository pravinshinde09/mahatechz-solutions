import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { cn } from "cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LiveStatusBadge, sessionTime } from "@/components/live/session-card";
import { Button } from "@/components/ui/button";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { adminLiveSessionSchema } from "@/lib/contracts/live";

export const metadata: Metadata = { title: "Live classes" };

type Session = z.infer<typeof adminLiveSessionSchema>;

export default async function AdminLivePage(props: PageProps<"/admin/live">) {
  const user = await requireStaff();
  if (!hasPermission(user, "live.manage")) notFound();
  const search = await props.searchParams;
  const when = search.when === "past" ? "past" : "upcoming";
  const result = await apiPage<Session, { page: number; pageSize: number; total: number }>(`/admin/live-sessions?when=${when}&pageSize=50`, { authed: true });
  const rows = result?.data ?? [];

  return (
    <>
      <PageHeader
        title="Live classes"
        description="Schedule classes, release the link 30 minutes before, then attach the recording and notes."
        actions={
          <Button asChild>
            <Link href="/admin/live/new">
              <Plus /> Schedule a class
            </Link>
          </Button>
        }
      />
      <nav aria-label="When" className="mb-5 flex gap-1 rounded-md border border-border p-1 sm:w-fit">
        {(["upcoming", "past"] as const).map((w) => (
          <Link key={w} href={w === "past" ? "/admin/live?when=past" : "/admin/live"} aria-current={when === w ? "page" : undefined} className={cn("flex-1 rounded px-4 py-1.5 text-center text-sm", when === w ? "bg-surface-raised font-medium" : "text-muted-foreground hover:text-foreground")}>
            {w === "upcoming" ? "Upcoming" : "Past"}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
              <tr>
                {["Class", "Course", "When", "Status", "Joins", "Recording"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-surface-raised/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/live/${s.id}`} className="font-medium hover:text-primary">
                      {s.title}
                    </Link>
                    {s.host ? <span className="block text-xs text-muted-foreground">{s.host}</span> : null}
                  </td>
                  <td className="px-4 py-3">{s.course.title}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap tabular">{sessionTime(s)}</td>
                  <td className="px-4 py-3">
                    <LiveStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 font-mono tabular" title="Students who clicked Join (activity signal, not attendance)">
                    {s.joinClicks}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.recording ? (s.recording.available ? "Attached" : "Processing") : when === "past" && s.status !== "CANCELLED" ? <span className="text-warning">Missing</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={when === "upcoming" ? "No classes scheduled" : "No past classes"} description="Scheduled classes show up for enrolled students with an email reminder 24 hours and 1 hour before." />
      )}
    </>
  );
}
