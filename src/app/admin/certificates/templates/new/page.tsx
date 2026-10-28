import { notFound } from "next/navigation";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { TemplateDesigner } from "../template-designer";

export default async function NewTemplatePage() {
  const user = await requireStaff();
  if (!hasPermission(user, "settings.manage")) notFound();
  return <TemplateDesigner template={null} />;
}
