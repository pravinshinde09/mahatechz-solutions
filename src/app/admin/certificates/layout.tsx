import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTabs } from "@/components/layout/section-tabs";
import { hasPermission, requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesLayout({ children }: LayoutProps<"/admin/certificates">) {
  const user = await requireStaff();
  if (!hasPermission(user, "certificate.read")) notFound();
  const tabs = [
    { href: "/admin/certificates", label: "Issued", exact: true },
    ...(hasPermission(user, "certificate.issue") ? [{ href: "/admin/certificates/eligible", label: "Ready to issue" }] : []),
    ...(hasPermission(user, "settings.manage") ? [{ href: "/admin/certificates/templates", label: "Templates" }] : []),
  ];
  return (
    <>
      <PageHeader title="Certificates" description="Issued only to students who met the course's completion rule, or with a recorded override. Every issue, revoke and reissue is audit-logged." />
      <SectionTabs label="Certificates" tabs={tabs} />
      {children}
    </>
  );
}
