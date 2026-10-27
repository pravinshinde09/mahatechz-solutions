import { Bell, BookOpen, CircleCheck, CreditCard, LifeBuoy, Megaphone, Radio, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { apiPage } from "@/lib/api/server";
import type { NotificationView } from "@/lib/contracts/communication";
import { formatDateTime } from "@/lib/format";
import { markAllReadAction } from "./actions";
import { NotificationLink } from "./notification-link";

export const metadata: Metadata = { title: "Notifications" };

const iconFor = (type: string): LucideIcon =>
  type.startsWith("live.") ? Radio : type === "announcement" ? Megaphone : type.startsWith("support.") ? LifeBuoy : type === "course.completed" ? CircleCheck : type.startsWith("payment") ? CreditCard : type.startsWith("course") ? BookOpen : Bell;

interface Page {
  data: NotificationView[];
  page: { nextCursor: string | null; hasMore: boolean };
  unreadCount: number;
}

export default async function NotificationsPage(props: PageProps<"/app/notifications">) {
  const search = await props.searchParams;
  const unreadOnly = search.filter === "unread";
  const cursor = typeof search.cursor === "string" ? search.cursor : "";
  const q = new URLSearchParams({ limit: "20", ...(unreadOnly ? { unread: "true" } : {}), ...(cursor ? { cursor } : {}) });
  // The envelope also carries `unreadCount` next to `data` and `page`.
  const page = (await apiPage<NotificationView, Page["page"]>(`/me/notifications?${q}`, { authed: true })) as Page | null;

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          page?.unreadCount ? (
            <form action={markAllReadAction}>
              <Button type="submit" variant="outline" size="sm">
                Mark all as read
              </Button>
            </form>
          ) : null
        }
      />
      <nav aria-label="Filter" className="mb-5 flex gap-2">
        {[
          { href: "/app/notifications", label: "All", active: !unreadOnly },
          { href: "/app/notifications?filter=unread", label: `Unread${page?.unreadCount ? ` (${page.unreadCount})` : ""}`, active: unreadOnly },
        ].map((f) => (
          <Link key={f.href} href={f.href} aria-current={f.active ? "page" : undefined} className={cn("rounded-full border px-3 py-1 text-sm", f.active ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
            {f.label}
          </Link>
        ))}
      </nav>
      {!page ? (
        <p className="text-danger">We couldn&apos;t load your notifications. Please reload the page.</p>
      ) : page.data.length ? (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
            {page.data.map((n) => {
              const Icon = iconFor(n.type);
              const body = (
                <>
                  <Icon className={cn("mt-0.5 size-5 shrink-0", n.readAt ? "text-muted-foreground" : "text-cyan")} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("leading-6", !n.readAt && "font-semibold")}>
                      {!n.readAt ? <span className="sr-only">Unread: </span> : null}
                      {n.title}
                    </p>
                    {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                    <time className="mt-1 block text-xs text-muted-foreground" dateTime={n.createdAt}>
                      {formatDateTime(n.createdAt)}
                    </time>
                  </div>
                  {!n.readAt ? <span className="mt-2 size-2 shrink-0 rounded-full bg-cyan" aria-hidden="true" /> : null}
                </>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <NotificationLink id={n.id} href={n.link} unread={!n.readAt} className="flex gap-3 px-4 py-3 hover:bg-surface-raised">
                      {body}
                    </NotificationLink>
                  ) : (
                    <div className="flex gap-3 px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {page.page.nextCursor ? (
            <div className="mt-4 text-center">
              <Link href={`/app/notifications?${new URLSearchParams({ ...(unreadOnly ? { filter: "unread" } : {}), cursor: page.page.nextCursor })}`} className="text-sm font-medium text-primary hover:underline">
                Older notifications →
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState title="You're all caught up" description="Class reminders, announcements and replies from support appear here." />
      )}
    </>
  );
}
