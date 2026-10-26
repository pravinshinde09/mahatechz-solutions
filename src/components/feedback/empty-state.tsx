import type { ReactNode } from "react";

/** Line-art illustration + one sentence + a primary action (spec §21.5 empty state). */
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      <svg viewBox="0 0 96 64" aria-hidden="true" className="mb-5 h-16 w-24 text-muted-foreground">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="8" y="8" width="80" height="48" rx="6" opacity=".5" />
          <path d="M20 40h14l6-12 8 20 6-14h22" stroke="var(--accent-cyan)" />
          <circle cx="20" cy="40" r="2.5" fill="var(--surface)" />
          <circle cx="76" cy="34" r="2.5" fill="var(--surface)" />
        </g>
      </svg>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
