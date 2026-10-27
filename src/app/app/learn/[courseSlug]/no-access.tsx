import { Lock } from "lucide-react";
import Link from "next/link";
import type { ApiError } from "@/lib/api/server";
import { Button } from "@/components/ui/button";

/** 403/404 from the learning API: explain and point somewhere useful. */
export function NoAccess({ error, courseSlug }: { error: ApiError; courseSlug: string }) {
  const enrollable = error.code === "ENROLLMENT_REQUIRED";
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-border bg-surface p-8 text-center">
      <Lock className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-sans text-2xl font-semibold">{enrollable ? "You don't have access to this course" : error.code === "NOT_ELIGIBLE" ? "Not open yet" : "Course not found"}</h1>
      <p className="mt-2 text-muted-foreground">{error.code === "NOT_FOUND" ? "It may have been removed, or the link is wrong." : error.message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {enrollable ? (
          <Button asChild>
            <Link href={`/courses/${courseSlug}`}>View the course</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/app/courses">My courses</Link>
        </Button>
      </div>
    </div>
  );
}
