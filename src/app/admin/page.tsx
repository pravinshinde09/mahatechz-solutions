import { CircleCheck, CircleDashed } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { hasPermission, requireStaff } from "@/lib/auth/session";

// KPI cards and the action queue (§22.3) arrive with the data they summarise (Phases 2–5).
const roadmap = [
  { phase: "Phase 1", label: "Accounts, staff invitations and two-factor security", done: true },
  { phase: "Phase 2", label: "Categories, course builder, video and resource uploads", done: false },
  { phase: "Phase 3", label: "Razorpay checkout, offline payment verification, enrolments", done: false },
  { phase: "Phase 4", label: "Course player, progress tracking, live classes, Android app", done: false },
  { phase: "Phase 5", label: "Certificates, analytics and reports", done: false },
];

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  return (
    <>
      <PageHeader title="Admin dashboard" description={`Signed in as ${user.roles.join(", ").toLowerCase().replaceAll("_", " ")}.`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className="font-sans text-xl leading-7 font-semibold">
            Platform build progress
          </h2>
          <ol className="mt-5 grid gap-3">
            {roadmap.map((r) => (
              <li key={r.phase} className="flex items-start gap-3">
                {r.done ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Planned" />
                )}
                <span>
                  <span className="font-mono text-sm text-muted-foreground">{r.phase}</span>
                  <span className="block">{r.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="next-heading">
          <h2 id="next-heading" className="font-sans text-xl leading-7 font-semibold">
            Next steps
          </h2>
          <ul className="mt-5 grid gap-3 text-sm">
            {hasPermission(user, "staff.invite") ? (
              <li>
                <Link href="/admin/staff" className="text-primary hover:underline">
                  Invite admins, instructors and support staff
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/admin/security" className="text-primary hover:underline">
                Review your two-factor settings
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
