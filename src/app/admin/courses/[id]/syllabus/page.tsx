import type { Metadata } from "next";
import { getAdminCourse } from "../data";
import { SyllabusBuilder } from "./syllabus-builder";

export const metadata: Metadata = { title: "Syllabus" };

export default async function SyllabusPage(props: PageProps<"/admin/courses/[id]/syllabus">) {
  const course = await getAdminCourse((await props.params).id);
  const modules = course.modules.filter((m) => !m.archivedAt).map((m) => ({ ...m, lessons: m.lessons.filter((l) => !l.archivedAt) }));
  return <SyllabusBuilder courseId={course.id} modules={modules} />;
}
