import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { adminAnnouncementSchema } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";
import { AnnouncementRowActions, NewAnnouncementForm } from "./announcement-forms";

export const metadata: Metadata = { title: "Announcements" };

type Announcement = z.infer<typeof adminAnnouncementSchema>;

export default async function AdminAnnouncementsPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "announcement.manage")) notFound();
  // Platform-wide posts need an administrator; instructors post to their own courses.
  const canPostPlatform = user.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN");
  const [list, courses] = await Promise.all([
    apiPage<Announcement, unknown>("/admin/announcements?pageSize=50", { authed: true }),
    apiPage<{ id: string; title: string; status: string }, unknown>("/admin/courses?pageSize=100", { authed: true }),
  ]);
  const rows = list?.data ?? [];
  const courseOptions = (courses?.data ?? []).filter((c) => c.status !== "ARCHIVED").map((c) => ({ value: c.id, label: c.title }));

  return (
    <>
      <PageHeader title="Announcements" description="Course news shows in the player's Announcements tab; platform news on every student's dashboard." />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <section aria-label="Announcements" className="grid content-start gap-3">
          {rows.length ? (
            rows.map((a) => (
              <article key={a.id} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {a.scope === "PLATFORM" ? "Every student" : a.course?.title} · {a.publishedAt ? `published ${formatDateTime(a.publishedAt)}` : "draft"}
                      {a.expiresAt ? ` · hides ${formatDateTime(a.expiresAt)}` : ""}
                    </p>
                    <h2 className="mt-1 leading-6 font-semibold">{a.title}</h2>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${a.publishedAt ? "border-success/40 text-success" : "border-border text-muted-foreground"}`}>{a.publishedAt ? "Published" : "Draft"}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">{a.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {a.author ? `By ${a.author} · ` : ""}
                    {a.readCount} read{a.sendEmail ? " · emailed" : ""}
                  </p>
                  <AnnouncementRowActions id={a.id} published={!!a.publishedAt} />
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No announcements yet" description="Post schedule changes, new resources or reminders for your students." />
          )}
        </section>
        <aside className="rounded-lg border border-border bg-surface p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 font-sans text-lg font-semibold">New announcement</h2>
          <NewAnnouncementForm courses={courseOptions} canPostPlatform={canPostPlatform} />
        </aside>
      </div>
    </>
  );
}
