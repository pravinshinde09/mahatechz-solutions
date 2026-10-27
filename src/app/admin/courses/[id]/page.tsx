import { getAdminCourse, getCategoryOptions, getTags } from "./data";
import { DetailsForm } from "./details-form";
import { ThumbnailPicker } from "./thumbnail-picker";

export default async function CourseDetailsPage(props: PageProps<"/admin/courses/[id]">) {
  const { id } = await props.params;
  const [course, categories, tags] = await Promise.all([getAdminCourse(id), getCategoryOptions(), getTags()]);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 rounded-lg border border-border bg-surface p-6 md:p-8">
        <DetailsForm course={course} categories={categories} softwareTags={tags.filter((t) => t.type === "SOFTWARE")} />
      </section>
      <aside className="min-w-0 rounded-lg border border-border bg-surface p-6 xl:self-start">
        <h2 className="font-sans text-lg font-semibold">Thumbnail</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Shown on course cards and the course page.</p>
        <ThumbnailPicker courseId={course.id} currentUrl={course.thumbnailUrl} />
      </aside>
    </div>
  );
}
