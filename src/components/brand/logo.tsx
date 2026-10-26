import Link from "next/link";
import { cn } from "cn";

/** Wordmark + circuit-node mark. Working name per spec Q-01 (final brand to be confirmed). */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-md font-display text-lg font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
        <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--surface-raised)" stroke="var(--border)" />
        <path d="M8 22V10l8 8 8-8v12" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="22" r="2" fill="var(--accent-cyan)" />
        <circle cx="24" cy="22" r="2" fill="var(--accent-cyan)" />
      </svg>
      <span>
        Mahatecz <span className="text-primary">Learning</span>
      </span>
    </Link>
  );
}
