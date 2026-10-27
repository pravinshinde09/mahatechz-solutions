import { MessageCircleWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { cn } from "cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { categoryLabel, priorityLabel, statusLabel } from "@/components/support/labels";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { adminTicketSummarySchema } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Support" };

type Ticket = z.infer<typeof adminTicketSummarySchema>;

const views = [
  { value: "ACTIVE", label: "Active" },
  { value: "OPEN", label: "Waiting for us" },
  { value: "PENDING_USER", label: "Waiting for student" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export default async function AdminSupportPage(props: PageProps<"/admin/support">) {
  const user = await requireStaff();
  if (!hasPermission(user, "support.manage")) notFound();
  const search = await props.searchParams;
  const status = views.find((v) => v.value === search.status)?.value ?? "ACTIVE";
  const mine = search.assignee === "me";
  const q = typeof search.q === "string" ? search.q.slice(0, 100) : "";
  const query = new URLSearchParams({ status, pageSize: "50", ...(mine ? { assignee: "me" } : {}), ...(q ? { q } : {}) });
  const result = await apiPage<Ticket, { page: number; pageSize: number; total: number }>(`/admin/support/tickets?${query}`, { authed: true });
  const rows = result?.data ?? [];
  const link = (next: Record<string, string>) => `/admin/support?${new URLSearchParams({ status, ...(mine ? { assignee: "me" } : {}), ...(q ? { q } : {}), ...next })}`;

  return (
    <>
      <PageHeader title="Support" description="Urgent and high-priority requests first, then the longest-waiting." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <nav aria-label="Status" className="flex flex-wrap gap-2">
          {views.map((v) => (
            <Link key={v.value} href={link({ status: v.value })} aria-current={status === v.value ? "page" : undefined} className={cn("rounded-full border px-3 py-1 text-sm", status === v.value ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              {v.label}
            </Link>
          ))}
        </nav>
        <Link href={mine ? `/admin/support?${new URLSearchParams({ status, ...(q ? { q } : {}) })}` : link({ assignee: "me" })} className={cn("rounded-full border px-3 py-1 text-sm", mine ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
          Assigned to me
        </Link>
        <form action="/admin/support" className="ml-auto flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input type="search" name="q" defaultValue={q} placeholder="Subject, email or #number" aria-label="Search tickets" className="h-9 w-56 rounded-sm border border-input bg-surface px-3 text-sm" />
        </form>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
              <tr>
                {["#", "Subject", "Student", "Status", "Priority", "Assignee", "Last message"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-surface-raised/60">
                  <td className="px-4 py-3 font-mono text-xs tabular text-muted-foreground">{t.number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/support/${t.id}`} className="font-medium hover:text-primary">
                      {t.subject}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {categoryLabel[t.category]}
                      {t.relatedCourse ? ` · ${t.relatedCourse.title}` : ""}
                    </span>
                    {t.awaitingStaff ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
                        <MessageCircleWarning className="size-3.5" aria-hidden="true" /> Student is waiting for a reply
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {t.student.fullName}
                    <span className="block text-xs text-muted-foreground">{t.student.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusLabel[t.status]!.tone}`}>{statusLabel[t.status]!.staff}</span>
                  </td>
                  <td className={cn("px-4 py-3 text-xs", t.priority === "URGENT" || t.priority === "HIGH" ? "font-medium text-danger" : "text-muted-foreground")}>{priorityLabel[t.priority]}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.assignee?.fullName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(t.lastMessageAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Nothing here" description={status === "ACTIVE" ? "No open requests — nice work." : "No tickets with this status."} />
      )}
    </>
  );
}
