import { BadgeCheck, Ban, Replace } from "lucide-react";
import { cn } from "cn";

const styles = {
  ISSUED: { label: "Valid", icon: BadgeCheck, className: "border-success/40 text-success" },
  VALID: { label: "Valid", icon: BadgeCheck, className: "border-success/40 text-success" },
  REVOKED: { label: "Revoked", icon: Ban, className: "border-danger/40 text-danger" },
  SUPERSEDED: { label: "Replaced", icon: Replace, className: "border-warning/40 text-warning" },
} as const;

/** Status with icon + text — never colour alone (spec §21.2). */
export function CertificateStatus({ status, className }: { status: keyof typeof styles; className?: string }) {
  const s = styles[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", s.className, className)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}
