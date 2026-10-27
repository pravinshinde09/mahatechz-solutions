import { LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/auth/session";
import { MobileShellNav, SidebarNav, type NavItem } from "./shell-nav";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Shared frame for the student (/app) and staff (/admin) areas. */
export function DashboardShell({
  user,
  nav,
  navLabel,
  area,
  switchLink,
  headerExtra,
  children,
}: {
  user: CurrentUser;
  nav: NavItem[];
  navLabel: string;
  area: string;
  switchLink?: { href: string; label: string };
  /** Area-specific header controls (e.g. the student notification bell). */
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-5 lg:flex">
        <div className="px-2">
          <Logo href="/" />
          <p className="mt-3 px-0.5 text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">{area}</p>
        </div>
        <div className="mt-6 flex-1">
          <SidebarNav items={nav} label={navLabel} />
        </div>
        {switchLink ? (
          <Link href={switchLink.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            {switchLink.label} →
          </Link>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <MobileShellNav items={nav} label={navLabel} />
          <div className="lg:hidden">
            <Logo href="/" className="text-base" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {headerExtra}
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-5 font-medium">{user.fullName}</p>
              <p className="text-xs leading-4 text-muted-foreground">{user.email}</p>
            </div>
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-surface-raised text-sm">{initials(user.fullName)}</AvatarFallback>
            </Avatar>
            {/* Plain form POST: works without JavaScript; the route handler checks Origin. */}
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
