import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseStatusBadge } from "@/components/course/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatDateTime, formatPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Courses" };

interface Row {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";
  category: { name: string };
  price: { amountPaise: number };
  thumbnailUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  updatedAt: string;
}

const statuses = ["", "DRAFT", "IN_REVIEW", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"] as const;

export default async function AdminCoursesPage(props: PageProps<"/admin/courses">) {
  const user = await requireStaff();
  const params = await props.searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const q = typeof params.q === "string" ? params.q : "";
  const page = Math.max(1, Number(params.page) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "25", ...(status ? { status } : {}), ...(q ? { q } : {}) });
  const result = await apiPage<Row, { page: number; pageSize: number; total: number }>(`/admin/courses?${query}`, { authed: true });
  const rows = result?.data ?? [];
  const total = result?.page.total ?? 0;

  return (
    <>
      <PageHeader
        title="Courses"
        description={hasPermission(user, "course.create") ? "Create courses, build their syllabus and publish them to the catalogue." : "Courses you are assigned to teach."}
        actions={
          hasPermission(user, "course.create") ? (
            <Button asChild>
              <Link href="/admin/courses/new">
                <Plus /> New course
              </Link>
            </Button>
          ) : null
        }
      />
      <form method="get" className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search by title" aria-label="Search by title" className="h-10 min-w-56 flex-1 rounded-sm border border-input bg-surface px-3" />
        <select name="status" defaultValue={status} aria-label="Status" className="h-10 rounded-sm border border-input bg-surface px-3">
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) : "All statuses"}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Course
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Syllabus
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-surface-raised/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${c.id}`} className="flex items-center gap-3 font-medium hover:text-primary">
                      {c.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small CDN thumbnail
                        <img src={c.thumbnailUrl} alt="" width={64} height={36} className="aspect-video w-16 shrink-0 rounded-sm object-cover" />
                      ) : (
                        <span className="grid-backdrop aspect-video w-16 shrink-0 rounded-sm border border-border" aria-hidden="true" />
                      )}
                      <span>
                        {c.title}
                        <span className="block text-xs font-normal text-muted-foreground">{c.category.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CourseStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular">
                    {c.moduleCount} modules · {c.lessonCount} lessons
                  </td>
                  <td className="px-4 py-3 font-mono tabular">{c.price.amountPaise ? formatPaise(c.price.amountPaise) : "Free"}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={q || status ? "No courses match" : "No courses yet"}
          description={q || status ? "Try a different search or status." : "Start with the basics — you can build the syllabus and publish later."}
          action={
            hasPermission(user, "course.create") && !q && !status ? (
              <Button asChild size="lg">
                <Link href="/admin/courses/new">Create your first course</Link>
              </Button>
            ) : undefined
          }
        />
      )}
      {total > 25 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {Math.ceil(total / 25)}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/courses?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`}>Previous</Link>
              </Button>
            ) : null}
            {page * 25 < total ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/courses?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`}>Next</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
