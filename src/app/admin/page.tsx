import { AlertTriangle, Award, ClipboardCheck, Film, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import { ColumnChart } from "@/components/charts/column-chart";
import { PageHeader } from "@/components/layout/page-header";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { Overview } from "@/lib/contracts/reports";
import { formatPaise } from "@/lib/format";

const RANGES = [7, 30, 90] as const;
const sourceLabel: Record<string, string> = { ONLINE: "online", OFFLINE: "offline", ADMIN_GRANT: "granted", FREE: "free", BULK_IMPORT: "bulk" };

/** The last `days` days ending today, as IST calendar dates. */
function istRange(days: number) {
  const today = new Date(Date.now() + 330 * 60_000);
  const from = new Date(today.getTime() - (days - 1) * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const hoursSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const user = await requireStaff();
  const search = await props.searchParams;
  const days = RANGES.find((d) => String(d) === search.range) ?? 30;
  const { from, to } = istRange(days);
  const res = hasPermission(user, "report.export") ? await authedRequest<Overview>(`/admin/analytics/overview?from=${from}&to=${to}`) : null;
  const o = res?.ok ? res.data : null;

  return (
    <>
      <PageHeader title="Admin dashboard" description={`Signed in as ${user.roles.join(", ").toLowerCase().replaceAll("_", " ")}.`} />

      {o ? (
        <>
          <nav aria-label="Date range" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {RANGES.map((d) => (
              <Link
                key={d}
                href={d === 30 ? "/admin" : `/admin?range=${d}`}
                aria-current={d === days ? "true" : undefined}
                className={cn("rounded-md border px-3 py-1.5", d === days ? "border-cyan bg-surface-raised font-medium" : "border-border text-muted-foreground hover:text-foreground")}
              >
                Last {d} days
              </Link>
            ))}
            <span className="text-muted-foreground">
              {dayLabel(o.from)} – {dayLabel(o.to)}, IST
            </span>
          </nav>

          <section aria-label="Key figures" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Students" value={o.students.total.toLocaleString("en-IN")} definition={`${o.students.verified} verified, ${o.students.unverified} unverified · ${o.students.newInRange} new in this period. Active or awaiting verification; suspended and deleted accounts don't count.`} />
            <Stat
              label="Active enrolments"
              value={o.activeEnrollments.total.toLocaleString("en-IN")}
              definition={`Access that is active today. ${Object.entries(o.activeEnrollments.bySource).map(([s, n]) => `${n} ${sourceLabel[s] ?? s}`).join(" · ") || "None yet."}`}
            />
            {o.revenue ? (
              <Stat label="Net revenue" value={formatPaise(o.revenue.netPaise)} definition={`${formatPaise(o.revenue.grossPaise)} captured − ${formatPaise(o.revenue.refundsPaise)} refunded. Pending, failed and granted access never count.`} />
            ) : null}
            <Stat
              label="Course completion rate"
              value={o.completionRate.rate === null ? "—" : `${o.completionRate.rate}%`}
              definition={`${o.completionRate.completed} of ${o.completionRate.denominator} enrolments that are at least 30 days old (active, expired or completed).`}
            />
            <Stat label="Average progress" value={o.averageProgress === null ? "—" : `${o.averageProgress}%`} definition="Mean of required-lesson completion over active enrolments." />
            {o.revenue ? (
              <Stat label="Checkout conversion" value={o.revenue.conversionRate === null ? "—" : `${o.revenue.conversionRate}%`} definition={`${o.revenue.ordersPaid} of ${o.revenue.ordersCreated} online orders created in this period were paid.`} />
            ) : null}
          </section>

          <div className={cn("mb-6 grid gap-6", o.revenue ? "xl:grid-cols-2" : "")}>
            <section aria-labelledby="enrol-chart" className="min-w-0 rounded-lg border border-border bg-surface p-5">
              <h2 id="enrol-chart" className="font-sans text-base font-semibold">
                New enrolments per day
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">All sources except pending offline payments.</p>
              <ColumnChart label="New enrolments per day" unit="Enrolments" data={o.daily.map((d) => ({ label: dayLabel(d.date), value: d.enrollments }))} kind="count" />
            </section>
            {o.revenue ? (
              <section aria-labelledby="revenue-chart" className="min-w-0 rounded-lg border border-border bg-surface p-5">
                <h2 id="revenue-chart" className="font-sans text-base font-semibold">
                  Net revenue per day
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">Verified only: captured payments minus processed refunds, by IST day.</p>
                <ColumnChart label="Net revenue per day" unit="Net revenue" data={o.daily.map((d) => ({ label: dayLabel(d.date), value: d.netRevenuePaise ?? 0 }))} kind="inr" />
              </section>
            ) : null}
          </div>

          <section aria-labelledby="queue-heading" className="mb-6 rounded-lg border border-border bg-surface p-5">
            <h2 id="queue-heading" className="font-sans text-base font-semibold">
              Needs attention
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {o.queue.pendingOfflinePayments !== null ? (
                <QueueItem
                  href="/admin/offline-payments"
                  icon={<ClipboardCheck className="size-4" aria-hidden="true" />}
                  count={o.queue.pendingOfflinePayments}
                  label="offline payments to verify"
                  detail={o.queue.oldestPendingOfflineAt ? `oldest ${hoursSince(o.queue.oldestPendingOfflineAt)} h` : undefined}
                />
              ) : null}
              {hasPermission(user, "certificate.issue") ? <QueueItem href="/admin/certificates/eligible" icon={<Award className="size-4" aria-hidden="true" />} count={o.queue.eligibleCertificates} label="certificates ready to issue" /> : null}
              <QueueItem href="/admin/media?status=FAILED" icon={<Film className="size-4" aria-hidden="true" />} count={o.queue.failedVideos} label="videos failed processing" />
              {o.queue.openTickets !== null ? <QueueItem href="/admin/support" icon={<LifeBuoy className="size-4" aria-hidden="true" />} count={o.queue.openTickets} label="open support tickets" /> : null}
            </ul>
          </section>

          <section aria-labelledby="courses-heading" className="rounded-lg border border-border bg-surface">
            <div className="p-5 pb-3">
              <h2 id="courses-heading" className="font-sans text-base font-semibold">
                Courses
              </h2>
              <p className="text-xs text-muted-foreground">At risk is an activity heuristic: no learning for 14 days, or far behind the course&apos;s recommended pace. Shown once a course has two weeks of activity.</p>
            </div>
            {o.courses.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-border text-xs text-muted-foreground">
                      <th className="px-5 py-2 font-normal">Course</th>
                      <th className="px-3 py-2 text-right font-normal">Active</th>
                      <th className="px-3 py-2 text-right font-normal">Avg progress</th>
                      <th className="px-3 py-2 text-right font-normal">Completion</th>
                      <th className="px-5 py-2 text-right font-normal">At risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.courses.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-2.5">
                          <Link href={`/admin/analytics/courses/${c.id}`} className="font-medium hover:underline">
                            {c.title}
                          </Link>
                          {c.status !== "PUBLISHED" ? <span className="ml-2 text-xs text-muted-foreground">{c.status.toLowerCase()}</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{c.activeEnrollments}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{c.averageProgress === null ? "—" : `${c.averageProgress}%`}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {c.completionRate === null ? "—" : `${c.completionRate}%`} <span className="text-xs text-muted-foreground">of {c.completionDenominator}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono tabular-nums">
                          {c.atRisk === null ? <span className="text-muted-foreground">—</span> : c.atRisk ? <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="size-3.5" aria-hidden="true" />{c.atRisk}</span> : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 pb-5 text-sm text-muted-foreground">No published courses yet.</p>
            )}
          </section>
        </>
      ) : res && !res.ok ? (
        <p role="alert" className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          Figures couldn&apos;t load: {res.error.message}
        </p>
      ) : null}

      <section className="mt-6 rounded-lg border border-border bg-surface p-6" aria-labelledby="next-heading">
        <h2 id="next-heading" className="font-sans text-base font-semibold">
          Shortcuts
        </h2>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {hasPermission(user, "course.create") ? <Shortcut href="/admin/courses/new">Create a course</Shortcut> : null}
          {hasPermission(user, "payment.read.details") ? <Shortcut href="/admin/offline-payments">Verify offline payments</Shortcut> : null}
          {hasPermission(user, "enrollment.grant") ? <Shortcut href="/admin/enrollments">Grant a student access</Shortcut> : null}
          {hasPermission(user, "certificate.issue") ? <Shortcut href="/admin/certificates/eligible">Issue certificates</Shortcut> : null}
          {hasPermission(user, "report.export") ? <Shortcut href="/admin/reports">Export a report (CSV)</Shortcut> : null}
          {hasPermission(user, "live.manage") ? <Shortcut href="/admin/live/new">Schedule a live class</Shortcut> : null}
          {hasPermission(user, "support.manage") ? <Shortcut href="/admin/support">Answer support requests</Shortcut> : null}
          {hasPermission(user, "settings.manage") ? <Shortcut href="/admin/settings">Set UPI / bank details</Shortcut> : null}
          {hasPermission(user, "staff.invite") ? <Shortcut href="/admin/staff">Invite staff</Shortcut> : null}
        </ul>
      </section>
    </>
  );
}

/** Spec §21.6 StatCard: the value, with its precise definition next to it (§17.2). */
function Stat({ label, value, definition }: { label: string; value: string; definition: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{definition}</p>
    </div>
  );
}

function QueueItem({ href, icon, count, label, detail }: { href: string; icon: React.ReactNode; count: number; label: string; detail?: string | undefined }) {
  return (
    <li>
      <Link href={href} className={cn("flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-surface-raised", count ? "border-warning/40" : "border-border")}>
        <span className={count ? "text-warning" : "text-muted-foreground"}>{icon}</span>
        <span className="text-sm">
          <span className="font-mono font-semibold tabular-nums">{count}</span> {label}
          {detail && count ? <span className="block text-xs text-muted-foreground">{detail}</span> : null}
        </span>
      </Link>
    </li>
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
