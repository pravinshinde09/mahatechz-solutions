import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificatePreview } from "@/components/certificates/certificate-preview";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { CertificateTemplateView } from "@/lib/contracts/certification";

export default async function TemplatesPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "settings.manage")) notFound();
  const res = await authedRequest<CertificateTemplateView[]>("/admin/certificate-templates");
  const templates = res.ok ? res.data : [];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">Choose a template for each course on its Certificate tab. Editing a template changes future certificates only — issued ones keep their printed text.</p>
        <Button asChild>
          <Link href="/admin/certificates/templates/new">
            <Plus aria-hidden="true" /> New template
          </Link>
        </Button>
      </div>
      {!templates.length ? (
        <EmptyState title="No templates yet" description="Create one to start issuing certificates. The built-in design works without any artwork." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/certificates/templates/${t.id}`} className="block overflow-hidden rounded-lg border border-border bg-surface hover:border-primary/40">
                <CertificatePreview
                  layout={t.layout}
                  accentColor={t.accentColor}
                  organizationName={t.organizationName}
                  heading={t.heading}
                  bodyText={t.bodyText}
                  signatoryName={t.signatoryName}
                  signatoryTitle={t.signatoryTitle}
                  recipientName="Asha Patil"
                  courseTitle="Course title"
                  completedOn="14 February 2027"
                  certificateNumber="MZT-ACE-2027-000042"
                  hasBackground={!!t.backgroundAssetId}
                  className="block h-auto w-full border-b border-border"
                  title={`${t.name} template preview`}
                />
                <div className="p-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Used by {t.courseCount} course{t.courseCount === 1 ? "" : "s"} · {t.certificateCount} issued
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
