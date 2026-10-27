import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { apiPage, apiRequest } from "@/lib/api/server";
import type { CourseCard as CourseCardData } from "@/lib/contracts/catalog";
import { levelLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Courses",
  description: "AutoCAD Electrical, Revit MEP and electrical design courses — recorded lectures, live classes and certificates.",
  alternates: { canonical: "/courses" },
};

type CategoryNode = { slug: string; name: string; courseCount: number; children: { slug: string; name: string; courseCount: number }[] };

const sorts = [
  ["newest", "Newest"],
  ["popular", "Most popular"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

const FILTERS = ["q", "category", "level", "price", "sort", "cursor"] as const;

/** Server-rendered catalogue (FR-CAT-02): a plain GET form keeps filters in the URL and works without JS. */
export default async function CoursesPage(props: PageProps<"/courses">) {
  const raw = await props.searchParams;
  const params = Object.fromEntries(FILTERS.flatMap((k) => (typeof raw[k] === "string" && raw[k] ? [[k, raw[k] as string]] : []))) as Partial<Record<(typeof FILTERS)[number], string>>;
  const query = new URLSearchParams({ ...params, limit: "12" });

  const [page, categories] = await Promise.all([apiPage<CourseCardData>(`/courses?${query}`), apiRequest<CategoryNode[]>("/categories")]);
  const tree = categories.ok ? categories.data : [];
  const filtered = Boolean(params.q || params.category || params.level || params.price);
  const nextHref = page?.page.nextCursor ? `/courses?${new URLSearchParams({ ...params, cursor: page.page.nextCursor })}` : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
      <PageHeader title="Courses" description="AutoCAD Electrical, Revit MEP and electrical design — from fundamentals to project work." />

      <form action="/courses" method="get" className="mb-8 grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_repeat(4,auto)_auto] md:items-end" role="search">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Search</span>
          <span className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              name="q"
              type="search"
              defaultValue={params.q}
              placeholder="e.g. panel layout, Revit lighting"
              className="h-11 w-full rounded-sm border border-input bg-background pr-3 pl-9"
            />
          </span>
        </label>
        <Select name="category" label="Category" value={params.category}>
          <option value="">All categories</option>
          {tree.map((c) => (
            <optgroup key={c.slug} label={c.name}>
              <option value={c.slug}>All {c.name}</option>
              {c.children.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Select name="level" label="Level" value={params.level}>
          <option value="">Any level</option>
          {Object.entries(levelLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="price" label="Price" value={params.price}>
          <option value="">Free & paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </Select>
        <Select name="sort" label="Sort by" value={params.sort}>
          {/* With a search term the API ranks by relevance unless another order is chosen. */}
          <option value="">{params.q ? "Best match" : "Newest"}</option>
          {sorts.filter(([value]) => params.q || value !== "newest").map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" size="lg">
          Apply
        </Button>
      </form>

      {page && page.data.length ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {page.page.total} {page.page.total === 1 ? "course" : "courses"}
            {filtered ? (
              <>
                {" · "}
                <Link href="/courses" className="text-primary hover:underline">
                  Clear filters
                </Link>
              </>
            ) : null}
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.data.map((course, i) => (
              <li key={course.id}>
                <CourseCard course={course} priority={i < 3} />
              </li>
            ))}
          </ul>
          {nextHref ? (
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href={nextHref}>Next page</Link>
              </Button>
            </div>
          ) : null}
        </>
      ) : filtered ? (
        <EmptyState
          title="No courses match these filters"
          description="Try a different search term or remove a filter."
          action={
            <Button asChild size="lg">
              <Link href="/courses">Show all courses</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Our first courses are being recorded"
          description="Create a free account and we'll email you as soon as enrolment opens."
          action={
            <Button asChild size="lg">
              <Link href="/register">Get notified</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function Select({ name, label, value, children }: { name: string; label: string; value?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="h-11 rounded-sm border border-input bg-background px-3">
        {children}
      </select>
    </label>
  );
}
