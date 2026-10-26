import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavItem } from "@/components/layout/shell-nav";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Mahatecz Learning" }, robots: { index: false } };

// Further sections (live classes, certificates, payments, support) arrive with their phases (§31).
const nav: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/app/courses", label: "My courses", icon: "courses" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

export default async function StudentLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  return (
    <DashboardShell
      user={user}
      nav={nav}
      navLabel="Student"
      area="Student area"
      {...(user.isStaff ? { switchLink: { href: "/admin", label: "Admin area" } } : {})}
    >
      {children}
    </DashboardShell>
  );
}
