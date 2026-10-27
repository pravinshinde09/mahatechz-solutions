import { Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavItem } from "@/components/layout/shell-nav";
import { apiPage } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Mahatecz Learning" }, robots: { index: false } };

// Certificates arrive with Phase 5 (§31).
const nav: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/app/courses", label: "My courses", icon: "courses" },
  { href: "/app/live", label: "Live classes", icon: "live" },
  { href: "/app/progress", label: "Progress", icon: "progress" },
  { href: "/app/notifications", label: "Notifications", icon: "notifications" },
  { href: "/app/payments", label: "Payments", icon: "payments" },
  { href: "/app/support", label: "Help & support", icon: "support" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

async function NotificationBell() {
  const page = (await apiPage("/me/notifications?limit=1&unread=true", { authed: true })) as { unreadCount?: number } | null;
  const unread = page?.unreadCount ?? 0;
  return (
    <Link
      href="/app/notifications"
      className="relative flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="size-5" />
      {unread ? (
        <span className="absolute top-1.5 right-1.5 min-w-4 rounded-full bg-cyan px-1 text-center font-mono text-[10px] leading-4 font-semibold text-background" aria-hidden="true">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export default async function StudentLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  return (
    <DashboardShell
      user={user}
      nav={nav}
      navLabel="Student"
      area="Student area"
      headerExtra={<NotificationBell />}
      {...(user.isStaff ? { switchLink: { href: "/admin", label: "Admin area" } } : {})}
    >
      {children}
    </DashboardShell>
  );
}
