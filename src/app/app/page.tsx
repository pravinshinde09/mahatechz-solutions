import { ArrowRight, BookOpen, Clock, Settings } from "lucide-react";
import Link from "next/link";
import { EnrollmentCard, isUsable, type EnrollmentView } from "@/components/course/enrollment-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { VerifyEmailBanner } from "./resend-verification";

export default async function StudentDashboardPage() {
  const user = await requireUser();
  const res = await authedRequest<EnrollmentView[]>("/me/enrollments");
  const enrollments = res.ok ? res.data : [];
  const active = enrollments.filter(isUsable);
  const pending = enrollments.filter((e) => e.status === "PENDING");
  const firstName = user.fullName.split(" ")[0];
  return (
    <>
      <PageHeader title={`Hello, ${firstName}`} description="Your learning at a glance." />
      {!user.emailVerified ? <VerifyEmailBanner email={user.email} /> : null}

      {pending.length ? (
        <Alert variant="info" className="mb-8">
          <Clock />
          <AlertDescription>
            {pending.length === 1 ? "One offline payment is" : `${pending.length} offline payments are`} being verified.{" "}
            <Link href="/app/payments" className="underline">
              View status
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className={active.length ? "mb-4 font-sans text-xl font-semibold" : "sr-only"}>
          Your courses
        </h2>
        {active.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.slice(0, 6).map((e) => (
              <li key={e.id}>
                <EnrollmentCard enrollment={e} />
              </li>
            ))}
          </ul>
        ) : (
          // Phase 4 adds "continue learning", upcoming live classes and progress (§14.1).
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
        )}
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
