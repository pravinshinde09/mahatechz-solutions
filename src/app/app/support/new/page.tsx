import type { Metadata } from "next";
import Link from "next/link";
import { type EnrollmentView } from "@/components/course/enrollment-card";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { NewTicketForm } from "./new-ticket-form";

export const metadata: Metadata = { title: "New support request" };

export default async function NewTicketPage(props: PageProps<"/app/support/new">) {
  const search = await props.searchParams;
  const res = await authedRequest<EnrollmentView[]>("/me/enrollments");
  const courses = (res.ok ? res.data : []).map((e) => ({ value: e.course.id, label: e.course.title }));
  const category = typeof search.category === "string" ? search.category : undefined;
  return (
    <div className="max-w-2xl">
      <Link href="/app/support" className="text-sm text-muted-foreground hover:text-foreground">
        ← Help & support
      </Link>
      <PageHeader title="New support request" description="Describe what happened and what you expected. Screenshots help us fix things faster." />
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <NewTicketForm courses={courses} defaultCategory={category} />
      </section>
    </div>
  );
}
