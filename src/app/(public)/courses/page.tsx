import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Courses" };

// Phase 2 replaces this with the searchable catalogue backed by GET /courses.
export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
      <PageHeader title="Courses" description="AutoCAD Electrical, Revit MEP and electrical design — from fundamentals to project work." />
      <EmptyState
        title="Our first courses are being recorded"
        description="Create a free account and we'll email you as soon as enrolment opens."
        action={
          <Button asChild size="lg">
            <Link href="/register">Get notified</Link>
          </Button>
        }
      />
    </div>
  );
}
