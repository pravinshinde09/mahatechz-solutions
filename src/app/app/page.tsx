import { ArrowRight, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { VerifyEmailBanner } from "./resend-verification";

export default async function StudentDashboardPage() {
  const user = await requireUser();
  const firstName = user.fullName.split(" ")[0];
  return (
    <>
      <PageHeader title={`Hello, ${firstName}`} description="Your learning at a glance." />
      {!user.emailVerified ? <VerifyEmailBanner email={user.email} /> : null}

      <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="sr-only">
          Continue learning
        </h2>
        {/* Phase 4 fills this with enrolled courses, progress and upcoming live classes (§14.1). */}
        <EmptyState
          title="You haven't enrolled in a course yet"
          description="Browse the catalogue to find your first course. Your progress and upcoming classes will appear here."
          action={
            <Button asChild size="lg">
              <Link href="/courses">
                Browse courses <ArrowRight />
              </Link>
            </Button>
          }
        />
      </section>

      <section aria-label="Shortcuts" className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/app/courses" className="group rounded-md border border-border bg-surface p-5 hover:border-primary/40 hover:bg-surface-raised">
          <BookOpen className="size-5 text-cyan" aria-hidden="true" />
          <p className="mt-3 font-semibold group-hover:text-primary">My courses</p>
          <p className="mt-1 text-sm text-muted-foreground">Everything you&apos;re enrolled in.</p>
        </Link>
        <Link href="/app/settings" className="group rounded-md border border-border bg-surface p-5 hover:border-primary/40 hover:bg-surface-raised">
          <Settings className="size-5 text-cyan" aria-hidden="true" />
          <p className="mt-3 font-semibold group-hover:text-primary">Profile &amp; security</p>
          <p className="mt-1 text-sm text-muted-foreground">Update your details and password.</p>
        </Link>
      </section>
    </>
  );
}
