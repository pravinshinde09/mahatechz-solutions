import type { Metadata } from "next";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { CertificateTemplateView } from "@/lib/contracts/certification";
import { getAdminCourse } from "../data";
import { CompletionForm } from "./completion-form";

export const metadata: Metadata = { title: "Completion & certificate" };

export default async function CompletionPage(props: PageProps<"/admin/courses/[id]/certificate">) {
  const user = await requireStaff();
  const course = await getAdminCourse((await props.params).id);
  const canChooseTemplate = hasPermission(user, "settings.manage");
  const templatesRes = canChooseTemplate ? await authedRequest<CertificateTemplateView[]>("/admin/certificate-templates") : null;
  const templates = canChooseTemplate ? (templatesRes?.ok ? templatesRes.data.map((t) => ({ value: t.id, label: t.name })) : []) : null;
  const quizzes = course.modules.flatMap((m) => m.lessons.filter((l) => l.type === "QUIZ" && !l.archivedAt).map((l) => ({ id: l.id, title: l.title, published: l.isPublished && m.isPublished })));
  return (
    <section className="max-w-2xl rounded-lg border border-border bg-surface p-6 md:p-8">
      <CompletionForm course={course} templates={templates} quizzes={quizzes} />
    </section>
  );
}
