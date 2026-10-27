import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { z } from "zod";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { categoryLabel, statusLabel } from "@/components/support/labels";
import { Button } from "@/components/ui/button";
import { apiPage } from "@/lib/api/server";
import type { ticketSummarySchema } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Help & support" };

type Ticket = z.infer<typeof ticketSummarySchema>;

export default async function SupportPage() {
  const page = await apiPage<Ticket, { page: number; pageSize: number; total: number }>("/support/tickets?pageSize=50", { authed: true });
  const tickets = page?.data ?? [];
  return (
    <>
      <PageHeader
        title="Help & support"
        description="Ask about payments, course access or anything else. We usually reply within one working day."
        actions={
          <Button asChild>
            <Link href="/app/support/new">
              <Plus /> New request
            </Link>
          </Button>
        }
      />
      {tickets.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/app/support/${t.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-raised sm:flex-row sm:items-center sm:gap-4">
                <span className="font-mono text-sm text-muted-foreground tabular">#{t.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {categoryLabel[t.category]}
                    {t.relatedCourse ? ` · ${t.relatedCourse.title}` : ""} · updated {formatDateTime(t.lastMessageAt)}
                  </span>
                </span>
                <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusLabel[t.status]!.tone}`}>{statusLabel[t.status]!.student}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No support requests"
          description="If something isn't working — a payment, a lesson, a certificate — tell us and we'll help."
          action={
            <Button asChild>
              <Link href="/app/support/new">Ask for help</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
