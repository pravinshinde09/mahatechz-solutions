import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { getLearnCourse } from "./data";
import { NoAccess } from "./no-access";

/** /app/learn/:course → the lesson to continue with (spec §14.1 "Continue learning"). */
export default async function LearnCoursePage(props: PageProps<"/app/learn/[courseSlug]">) {
  const { courseSlug } = await props.params;
  const search = await props.searchParams;
  const res = await getLearnCourse(courseSlug);
  if (!res.ok) return <NoAccess error={res.error} courseSlug={courseSlug} />;
  const target = res.data.resume?.lessonId;
  if (!target) return <EmptyState title="No lessons published yet" description="Your instructor is still preparing this course. You'll be notified when lessons go live." />;
  const tab = typeof search.tab === "string" ? `?tab=${encodeURIComponent(search.tab)}` : "";
  redirect(`/app/learn/${res.data.course.slug}/${target}${tab}`);
}
