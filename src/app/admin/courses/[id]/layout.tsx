import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { CourseStatusBadge } from "@/components/course/status-badge";
import { requireStaff } from "@/lib/auth/session";
import { CourseTabs } from "./course-tabs";
import { getAdminCourse } from "./data";

export default async function CourseEditorLayout(props: LayoutProps<"/admin/courses/[id]">) {
  await requireStaff();
  const { id } = await props.params;
  const course = await getAdminCourse(id);
  return (
    <>
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All courses
      </Link>
      <div className="mt-3 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[34px] font-semibold">{course.title}</h1>
          <p className="mt-1 font-mono text-sm break-all text-muted-foreground">/courses/{course.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <CourseStatusBadge status={course.status} />
          {course.status === "PUBLISHED" ? (
            <Link href={`/courses/${course.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View live <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
      <CourseTabs base={`/admin/courses/${course.id}`} />
      {props.children}
    </>
  );
}
