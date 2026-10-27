import { CircleCheck, CircleDashed } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { formatPaise } from "@/lib/format";

interface Revenue {
  grossPaise: number;
  refundsPaise: number;
  netPaise: number;
  capturedCount: number;
  pendingOfflineCount: number;
  oldestPendingOfflineAt: string | null;
  ordersCreated: number;
  ordersPaid: number;
  flaggedPayments: number;
}

const roadmap = [
  { phase: "Phase 1", label: "Accounts, staff invitations and two-factor security", done: true },
  { phase: "Phase 2", label: "Categories, course builder, video and resource uploads", done: true },
  { phase: "Phase 3", label: "Razorpay checkout, offline payment verification, enrolments", done: true },
  { phase: "Phase 4", label: "Course player, progress tracking, live classes, Android app", done: false },
  { phase: "Phase 5", label: "Certificates, analytics and reports", done: false },
];

const hoursSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);

/** Month to date in IST, as YYYY-MM-DD bounds for the revenue endpoint. */
function monthToDate() {
  const ist = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  return { from: `${ist.slice(0, 8)}01`, to: ist };
}

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const canSeeMoney = hasPermission(user, "payment.read.details");
  const { from, to } = monthToDate();
  const revenue = canSeeMoney ? await authedRequest<Revenue>(`/admin/analytics/revenue?from=${from}&to=${to}`) : null;
  const r = revenue?.ok ? revenue.data : null;
  const pendingHours = r?.oldestPendingOfflineAt ? hoursSince(r.oldestPendingOfflineAt) : null;

  return (
    <>
      <PageHeader title="Admin dashboard" description={`Signed in as ${user.roles.join(", ").toLowerCase().replaceAll("_", " ")}.`} />
      {r ? (
        <section aria-label="Key figures this month" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Net revenue (this month)" value={formatPaise(r.netPaise)} definition="Captured online payments and approved offline payments, minus processed refunds. Pending, failed and granted access never count." />
          <Stat
            label="Pending offline payments"
            value={String(r.pendingOfflineCount)}
            definition={pendingHours !== null ? `Oldest waiting ${pendingHours < 48 ? `${pendingHours} h` : `${Math.floor(pendingHours / 24)} days`}.` : "Nothing waiting."}
            href={r.pendingOfflineCount ? "/admin/offline-payments" : undefined}
            tone={r.pendingOfflineCount ? "warning" : undefined}
          />
          <Stat label="Checkout conversion" value={r.ordersCreated ? `${Math.round((100 * r.ordersPaid) / r.ordersCreated)}%` : "—"} definition={`${r.ordersPaid} of ${r.ordersCreated} online orders this month were paid.`} />
          <Stat
            label="Payments needing attention"
            value={String(r.flaggedPayments)}
            definition="Duplicate purchases, amount mismatches and disputes."
            href={r.flaggedPayments ? "/admin/payments?flagged=true" : undefined}
            tone={r.flaggedPayments ? "warning" : undefined}
          />
        </section>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className="font-sans text-xl leading-7 font-semibold">
            Platform build progress
          </h2>
          <ol className="mt-5 grid gap-3">
            {roadmap.map((item) => (
              <li key={item.phase} className="flex items-start gap-3">
                {item.done ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Done" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Planned" />}
                <span>
                  <span className="font-mono text-sm text-muted-foreground">{item.phase}</span>
                  <span className="block">{item.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="next-heading">
          <h2 id="next-heading" className="font-sans text-xl leading-7 font-semibold">
            Shortcuts
          </h2>
          <ul className="mt-5 grid gap-3 text-sm">
            {hasPermission(user, "course.create") ? <Shortcut href="/admin/courses/new">Create a course</Shortcut> : null}
            {canSeeMoney ? <Shortcut href="/admin/offline-payments">Verify offline payments</Shortcut> : null}
            {hasPermission(user, "enrollment.grant") ? <Shortcut href="/admin/enrollments">Grant a student access</Shortcut> : null}
            {hasPermission(user, "settings.manage") ? <Shortcut href="/admin/settings">Set UPI / bank details</Shortcut> : null}
            {hasPermission(user, "staff.invite") ? <Shortcut href="/admin/staff">Invite staff</Shortcut> : null}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Spec §21.6 StatCard: value in mono, with its precise definition next to it (§17.2). */
function Stat({ label, value, definition, href, tone }: { label: string; value: string; definition: string; href?: string | undefined; tone?: "warning" | undefined }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular ${tone === "warning" ? "text-warning" : ""}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{definition}</p>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-lg border border-border bg-surface p-5 hover:border-primary/40 hover:bg-surface-raised">
      {body}
    </Link>
  ) : (
    <div className="rounded-lg border border-border bg-surface p-5">{body}</div>
  );
}

function Shortcut({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-primary hover:underline">
        {children}
      </Link>
    </li>
  );
}
