import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnrollmentCard, isUsable, type EnrollmentView } from "@/components/course/enrollment-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authedRequest } from "@/lib/api/server";

export const metadata: Metadata = { title: "My courses" };

export default async function MyCoursesPage(props: PageProps<"/app/courses">) {
  const params = await props.searchParams;
  const res = await authedRequest<EnrollmentView[]>("/me/enrollments");
  const all = res.ok ? res.data : [];
  const active = all.filter(isUsable);
  const other = all.filter((e) => !isUsable(e) && e.status !== "REVOKED");

  return (
    <>
      <PageHeader title="My courses" />
      {params.enrolled ? (
        <Alert variant="success" className="mb-6">
          <CircleCheck />
          <AlertDescription>You&apos;re enrolled. Happy learning!</AlertDescription>
        </Alert>
      ) : null}
      {all.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Courses you enrol in will appear here with your progress."
          action={
            <Button asChild size="lg">
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-10">
          {active.length ? (
            <section aria-labelledby="active-heading">
              <h2 id="active-heading" className="mb-4 font-sans text-xl font-semibold">
                In progress
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((e) => (
                  <li key={e.id}>
                    <EnrollmentCard enrollment={e} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {other.length ? (
            <section aria-labelledby="other-heading">
              <h2 id="other-heading" className="mb-4 font-sans text-xl font-semibold">
                Pending and expired
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {other.map((e) => (
                  <li key={e.id}>
                    <EnrollmentCard enrollment={e} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
