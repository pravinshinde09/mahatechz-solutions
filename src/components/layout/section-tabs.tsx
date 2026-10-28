"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

/** Link tabs for a section (same look as the course editor tabs); the URL is the state. */
export function SectionTabs({ label, tabs }: { label: string; tabs: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-1 mb-6 overflow-x-auto border-b border-border">
      <ul className="flex min-w-max gap-1 px-1">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn("-mb-px inline-flex h-11 items-center border-b-2 px-3 text-sm transition-colors", active ? "border-cyan font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
