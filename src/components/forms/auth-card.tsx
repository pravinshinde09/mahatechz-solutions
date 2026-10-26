import type { ReactNode } from "react";

export function AuthCard({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-surface/95 p-6 shadow-card sm:p-8">
        <h1 className="text-[28px] leading-[34px] font-semibold">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
