import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { categoryLabel, statusLabel } from "@/components/support/labels";
import { MessageThread } from "@/components/support/message-thread";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { adminTicketDetailSchema } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";
import { StaffReplyForm, TicketSettingsForm } from "./ticket-forms";

export const metadata: Metadata = { title: "Support ticket" };

type Ticket = z.infer<typeof adminTicketDetailSchema>;

export default async function AdminTicketPage(props: PageProps<"/admin/support/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "support.manage")) notFound();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [res, staffRes] = await Promise.all([authedRequest<Ticket>(`/admin/support/tickets/${id}`), authedRequest<{ id: string; fullName: string }[]>("/admin/support/staff")]);
  if (!res.ok) notFound();
  const t = res.data;

  return (
    <>
      <Link href="/admin/support" className="text-sm text-muted-foreground hover:text-foreground">
        ← Support
      </Link>
      <PageHeader title={`#${t.number} · ${t.subject}`} description={`${categoryLabel[t.category]}${t.relatedCourse ? ` · ${t.relatedCourse.title}` : ""} · opened ${formatDateTime(t.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid content-start gap-6">
          <MessageThread ticketId={t.id} messages={t.messages} viewer="staff" />
          <section aria-labelledby="reply-heading" className="rounded-lg border border-border bg-surface p-5">
            <h2 id="reply-heading" className="mb-3 font-sans text-lg font-semibold">
              Reply
            </h2>
            <StaffReplyForm id={t.id} />
          </section>
        </div>
        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-border bg-surface p-5 text-sm">
            <h2 className="mb-3 font-sans text-base font-semibold">Student</h2>
            <p className="font-medium">{t.student.fullName}</p>
            <p className="text-muted-foreground">{t.student.email}</p>
            <p className="mt-3">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusLabel[t.status]!.tone}`}>{statusLabel[t.status]!.staff}</span>
            </p>
            {hasPermission(user, "enrollment.read") ? (
              <Link href={`/admin/enrollments?q=${encodeURIComponent(t.student.email)}`} className="mt-3 block text-primary hover:underline">
                View enrolments →
              </Link>
            ) : null}
          </section>
          <section className="rounded-lg border border-border bg-surface p-5">
            <TicketSettingsForm id={t.id} status={t.status} priority={t.priority} assigneeId={t.assignee?.id ?? null} staff={staffRes.ok ? staffRes.data : []} />
          </section>
        </aside>
      </div>
    </>
  );
}
