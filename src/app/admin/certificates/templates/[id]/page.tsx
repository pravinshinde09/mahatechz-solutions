import { CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { CertificateTemplateView } from "@/lib/contracts/certification";
import { TemplateDesigner } from "../template-designer";
import { ArchiveTemplateButton } from "./archive-button";

export default async function EditTemplatePage(props: PageProps<"/admin/certificates/templates/[id]">) {
  const user = await requireStaff();
  if (!hasPermission(user, "settings.manage")) notFound();
  const { id } = await props.params;
  const search = await props.searchParams;
  const res = await authedRequest<CertificateTemplateView>(`/admin/certificate-templates/${encodeURIComponent(id)}`);
  if (!res.ok) notFound();
  const t = res.data;
  return (
    <div className="grid gap-6">
      {search.created ? (
        <Alert variant="success" role="status">
          <CircleCheck />
          <AlertDescription>Template created. Choose it for a course on the course&apos;s Certificate tab.</AlertDescription>
        </Alert>
      ) : null}
      {t.archivedAt ? (
        <p className="text-muted-foreground">This template is archived and can&apos;t be edited.</p>
      ) : (
        <>
          <TemplateDesigner template={t} />
          <div className="border-t border-border pt-6">
            <ArchiveTemplateButton id={t.id} inUse={t.courseCount} />
          </div>
        </>
      )}
    </div>
  );
}
