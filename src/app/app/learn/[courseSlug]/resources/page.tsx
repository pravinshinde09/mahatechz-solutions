import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceList, type LearnResource } from "@/components/learn/resource-list";
import { authedRequest } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { getLearnCourse } from "../data";
import { NoAccess } from "../no-access";

export const metadata: Metadata = { title: "Course resources" };

const filters = [
  { value: "", label: "All" },
  { value: "documents", label: "Notes & PDFs" },
  { value: "practice", label: "Practice files" },
  { value: "links", label: "Links" },
] as const;

const matches = (r: LearnResource, type: string) =>
  !type || (type === "documents" && ["NOTE", "PDF", "ASSIGNMENT_SHEET", "REFERENCE", "IMAGE"].includes(r.type)) || (type === "practice" && r.type === "PRACTICE_FILE") || (type === "links" && r.type === "LINK");

/** Spec §22.2: grouped by module, or by date for daily class notes, with file-type filters. */
export default async function CourseResourcesPage(props: PageProps<"/app/learn/[courseSlug]/resources">) {
  const { courseSlug } = await props.params;
  const search = await props.searchParams;
  const group = search.group === "date" ? "date" : "module";
  const type = typeof search.type === "string" ? search.type : "";

  const courseRes = await getLearnCourse(courseSlug);
  if (!courseRes.ok) return <NoAccess error={courseRes.error} courseSlug={courseSlug} />;
  const course = courseRes.data;
  const res = await authedRequest<LearnResource[]>(`/learn/courses/${course.course.id}/resources`);
  const resources = (res.ok ? res.data : []).filter((r) => matches(r, type));

  const groups: { key: string; title: string; items: LearnResource[] }[] = [];
  const push = (key: string, title: string, r: LearnResource) => {
    const g = groups.find((x) => x.key === key) ?? groups[groups.push({ key, title, items: [] }) - 1]!;
    g.items.push(r);
  };
  if (group === "date") {
    for (const r of resources) push(r.classDate ?? "undated", r.classDate ? `Class of ${formatDate(r.classDate)}` : "Other resources", r);
    groups.sort((a, b) => (a.key === "undated" ? 1 : b.key === "undated" ? -1 : b.key.localeCompare(a.key)));
  } else {
    for (const r of resources.filter((x) => !x.moduleId)) push("course", "Whole course", r);
    for (const m of course.modules) for (const r of resources.filter((x) => x.moduleId === m.id)) push(m.id, m.title, r);
  }

  const href = (next: { group?: string; type?: string }) => {
    const q = new URLSearchParams({ ...(group === "date" ? { group } : {}), ...(type ? { type } : {}) });
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    const s = q.toString();
    return `/app/learn/${course.course.slug}/resources${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <Link href={`/app/learn/${course.course.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {course.course.title}
      </Link>
      <PageHeader title="Resources & daily notes" description="Notes, PDFs and practice drawings for this course." />
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex gap-1 rounded-md border border-border p-1" role="group" aria-label="Group by">
          {(["module", "date"] as const).map((g) => (
            <Link key={g} href={href({ group: g === "date" ? "date" : "" })} aria-current={group === g ? "true" : undefined} className={cn("rounded px-3 py-1.5 text-sm", group === g ? "bg-surface-raised font-medium" : "text-muted-foreground hover:text-foreground")}>
              {g === "module" ? "By module" : "By class date"}
            </Link>
          ))}
        </div>
        <nav aria-label="File type" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link key={f.value} href={href({ type: f.value })} aria-current={type === f.value ? "true" : undefined} className={cn("rounded-full border px-3 py-1 text-sm", type === f.value ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              {f.label}
            </Link>
          ))}
        </nav>
      </div>
      {groups.length ? (
        <div className="grid gap-8">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <h2 id={`g-${g.key}`} className="mb-3 font-sans text-lg font-semibold">
                {g.title}
              </h2>
              <ResourceList resources={g.items} showContext />
            </section>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No resources{type ? " of this type" : ""} yet.</p>
      )}
    </>
  );
}
