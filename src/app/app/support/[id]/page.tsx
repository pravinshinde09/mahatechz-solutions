import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { categoryLabel, statusLabel } from "@/components/support/labels";
import { MessageThread } from "@/components/support/message-thread";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import type { ticketDetailSchema } from "@/lib/contracts/communication";
import { resolveTicketAction } from "../actions";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Support request" };

type Ticket = z.infer<typeof ticketDetailSchema>;

export default async function TicketPage(props: PageProps<"/app/support/[id]">) {
  const { id } = await props.params;
  const search = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const res = await authedRequest<Ticket>(`/support/tickets/${id}`);
  if (!res.ok) notFound();
  const t = res.data;
  const status = statusLabel[t.status]!;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href="/app/support" className="text-sm text-muted-foreground hover:text-foreground">
        ← Help & support
      </Link>
      <header>
        <p className="font-mono text-sm text-muted-foreground tabular">#{t.number}</p>
        <h1 className="mt-1 font-sans text-2xl leading-8 font-semibold">{t.subject}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>{status.student}</span>
          {categoryLabel[t.category]}
          {t.relatedCourse ? ` · ${t.relatedCourse.title}` : ""}
        </p>
      </header>
      {search.created ? (
        <Alert variant="success">
          <CircleCheck />
          <AlertDescription>Request sent. We&apos;ll email you when support replies.</AlertDescription>
        </Alert>
      ) : null}

      <MessageThread ticketId={t.id} messages={t.messages} viewer="student" />

      {t.status === "CLOSED" ? (
        <p className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
          This request is closed. <Link href="/app/support/new" className="text-primary underline">Open a new one</Link> if you still need help.
        </p>
      ) : (
        <section aria-labelledby="reply-heading" className="rounded-lg border border-border bg-surface p-5">
          <h2 id="reply-heading" className="mb-3 font-sans text-lg font-semibold">
            Reply
          </h2>
          <ReplyForm id={t.id} />
          {t.status !== "RESOLVED" ? (
            <form action={resolveTicketAction.bind(null, t.id)} className="mt-4 border-t border-border pt-4">
              <Button type="submit" variant="ghost" size="sm">
                <CircleCheck /> My problem is solved
              </Button>
            </form>
          ) : null}
        </section>
      )}
    </div>
  );
}
