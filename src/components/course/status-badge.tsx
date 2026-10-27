import { Archive, CircleCheck, CircleDashed, EyeOff, Hourglass } from "lucide-react";
import { cn } from "cn";

const styles = {
  DRAFT: { label: "Draft", icon: CircleDashed, className: "border-border text-muted-foreground" },
  IN_REVIEW: { label: "In review", icon: Hourglass, className: "border-warning/40 text-warning" },
  PUBLISHED: { label: "Published", icon: CircleCheck, className: "border-success/40 text-success" },
  UNPUBLISHED: { label: "Unpublished", icon: EyeOff, className: "border-warning/40 text-warning" },
  ARCHIVED: { label: "Archived", icon: Archive, className: "border-border text-muted-foreground" },
} as const;

/** Status with icon + text — never colour alone (spec §21.2). */
export function CourseStatusBadge({ status }: { status: keyof typeof styles }) {
  const s = styles[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", s.className)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}
