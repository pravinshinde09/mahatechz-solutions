import Link from "next/link";
import { formatDate } from "@/lib/format";

export interface EnrollmentView {
  id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  source: string;
  expiresAt: string | null;
  progressPercent: number;
  completedAt: string | null;
  course: { id: string; title: string; slug: string; thumbnailUrl: string | null };
}

const statusText: Record<EnrollmentView["status"], string> = {
  ACTIVE: "Active",
  PENDING: "Payment under verification",
  EXPIRED: "Access expired",
  SUSPENDED: "Access suspended",
  REVOKED: "Access removed",
};

export const isUsable = (e: EnrollmentView) => e.status === "ACTIVE" && (!e.expiresAt || new Date(e.expiresAt) > new Date());

/** Enrolled course with progress (spec §21.6 ProgressBar: cyan fill, mono label, role=progressbar). */
export function EnrollmentCard({ enrollment: e }: { enrollment: EnrollmentView }) {
  const usable = isUsable(e);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="aspect-video bg-surface-raised">
        {e.course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN thumbnail
          <img src={e.course.thumbnailUrl} alt="" width={640} height={360} className={`size-full object-cover ${usable ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid-backdrop size-full" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-lg leading-6 font-semibold">{e.course.title}</h3>
        {usable ? (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-mono tabular">{e.progressPercent}%</span>
            </div>
            <div role="progressbar" aria-label={`${e.course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.progressPercent} className="h-2 overflow-hidden rounded-full bg-surface-raised">
              <div className="h-full bg-cyan" style={{ width: `${e.progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <p className={`text-sm ${e.status === "PENDING" ? "text-warning" : "text-muted-foreground"}`}>{statusText[e.status]}</p>
        )}
        <p className="mt-auto text-xs text-muted-foreground">
          {/* A suspended or revoked enrolment still carries its future expiry — don't call that "ended". */}
          {usable ? (e.expiresAt ? `Access until ${formatDate(e.expiresAt)}` : "Lifetime access") : e.expiresAt && (e.status === "EXPIRED" || e.status === "ACTIVE") ? `Access ended ${formatDate(e.expiresAt)}` : ""}
        </p>
        {usable ? (
          <Link href={`/app/learn/${e.course.slug}`} className="text-sm font-medium text-primary hover:underline">
            {e.completedAt ? "Review course" : e.progressPercent > 0 ? "Continue learning" : "Start learning"} →
          </Link>
        ) : e.status === "EXPIRED" ? (
          <Link href={`/checkout/${e.course.id}`} className="text-sm font-medium text-primary hover:underline">
            Renew access →
          </Link>
        ) : e.status === "PENDING" ? (
          <Link href="/app/payments" className="text-sm font-medium text-primary hover:underline">
            View payment status →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
