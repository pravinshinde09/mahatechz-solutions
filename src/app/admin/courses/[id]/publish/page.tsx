import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { getAdminCourse } from "../data";
import { LifecycleButtons } from "./lifecycle-buttons";

export const metadata: Metadata = { title: "Publish" };

type Checklist = { ready: boolean; items: { key: string; label: string; ok: boolean; detail?: string }[] };

export default async function PublishPage(props: PageProps<"/admin/courses/[id]/publish">) {
  const { id } = await props.params;
  const [user, course, checklist] = await Promise.all([requireStaff(), getAdminCourse(id), authedRequest<Checklist>(`/admin/courses/${id}/publish-checklist`)]);
  const items = checklist.ok ? checklist.data.items : [];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8" aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="font-sans text-xl font-semibold">
          Publish checklist
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything below must pass before the course can go live.</p>
        <ul className="mt-5 grid gap-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-start gap-3">
              {item.ok ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" /> : <CircleX className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Not done" />}
              <span>
                <span className={item.ok ? "" : "font-medium"}>{item.label}</span>
                {!item.ok && item.detail ? <span className="block text-sm text-muted-foreground">{item.detail}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <aside className="rounded-lg border border-border bg-surface p-6 lg:self-start">
        <h2 className="font-sans text-lg font-semibold">Status</h2>
        <LifecycleButtons
          courseId={course.id}
          status={course.status}
          ready={checklist.ok && checklist.data.ready}
          canPublish={hasPermission(user, "course.publish")}
          canArchive={hasPermission(user, "course.archive")}
          canDelete={hasPermission(user, "course.delete") && course.status === "DRAFT" && !course.publishedAt}
        />
      </aside>
    </div>
  );
}
