import type { ReactNode } from "react";

/** Simple readable layout for static content pages (about, legal). */
export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-[28px] leading-[34px] font-semibold md:text-4xl md:leading-[44px]">{title}</h1>
      {updated ? <p className="mt-2 font-mono text-sm text-muted-foreground">Last updated {updated}</p> : null}
      <div className="mt-8 grid gap-5 leading-[26px] text-foreground/90 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </article>
  );
}

/** Shown on legal pages until counsel-approved text is published (spec §29.1). */
export function DraftNotice() {
  return (
    <p className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <strong className="text-warning">Draft.</strong> This policy is a placeholder pending legal review and will be replaced before payments go
      live.
    </p>
  );
}
