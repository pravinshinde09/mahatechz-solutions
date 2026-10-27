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
        ...(hasPermission(user, "payment.read.details") ? [{ href: "/admin/offline-payments", label: "Offline payments", icon: "verify" } as const] : []),
        ...(hasPermission(user, "payment.read.details") ? [{ href: "/admin/payments", label: "Payments", icon: "payments" } as const] : []),
        ...(hasPermission(user, "enrollment.read") ? [{ href: "/admin/enrollments", label: "Enrolments", icon: "enrollments" } as const] : []),
        ...(hasPermission(user, "staff.invite") ? [{ href: "/admin/staff", label: "Staff", icon: "staff" } as const] : []),
        ...(hasPermission(user, "settings.manage") ? [{ href: "/admin/settings", label: "Settings", icon: "settings" } as const] : []),
        { href: "/admin/security", label: "Security", icon: "security" },
      ]
    : [{ href: "/admin/security", label: "Security", icon: "security" }];

  return (
    <DashboardShell user={user} nav={nav} navLabel="Admin" area="Admin area" switchLink={{ href: "/app", label: "Student area" }}>
      {children}
    </DashboardShell>
  );
}
