import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My courses" };

// Phase 4: tabs In progress / Completed / Expired backed by GET /me/enrollments (§22.2).
export default function MyCoursesPage() {
  return (
    <>
      <PageHeader title="My courses" />
      <EmptyState
        title="No courses yet"
        description="Courses you enrol in will appear here with your progress."
        action={
          <Button asChild size="lg">
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />
    </>
  );
}
