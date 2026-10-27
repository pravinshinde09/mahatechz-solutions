import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavItem } from "@/components/layout/shell-nav";
import { hasPermission, requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Mahatecz" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Pages enforce 2FA themselves; the layout must still render the security page without it.
  const user = await requireStaff({ allowWithout2fa: true });
  const nav: NavItem[] = user.twoFactorEnabled
    ? [
        { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
        ...(hasPermission(user, "course.read.unpublished") ? [{ href: "/admin/courses", label: "Courses", icon: "courses" } as const] : []),
        ...(hasPermission(user, "category.manage") ? [{ href: "/admin/categories", label: "Categories & tags", icon: "categories" } as const] : []),
        ...(hasPermission(user, "media.upload") ? [{ href: "/admin/media", label: "Media library", icon: "media" } as const] : []),
        ...(hasPermission(user, "staff.invite") ? [{ href: "/admin/staff", label: "Staff", icon: "staff" } as const] : []),
        { href: "/admin/security", label: "Security", icon: "security" },
      ]
    : [{ href: "/admin/security", label: "Security", icon: "security" }];

  return (
    <DashboardShell user={user} nav={nav} navLabel="Admin" area="Admin area" switchLink={{ href: "/app", label: "Student area" }}>
      {children}
    </DashboardShell>
  );
}
