"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function CourseTabs({ base }: { base: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: base, label: "Details", exact: true },
    { href: `${base}/pricing`, label: "Pricing & access" },
    { href: `${base}/syllabus`, label: "Syllabus", also: `${base}/lessons` },
    { href: `${base}/resources`, label: "Resources & notes" },
    { href: `${base}/publish`, label: "Publish" },
  ];
  return (
    <nav aria-label="Course editor" className="-mx-1 mb-6 overflow-x-auto border-b border-border">
      <ul className="flex min-w-max gap-1 px-1">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href) || (t.also ? pathname.startsWith(t.also) : false);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center border-b-2 px-3 text-sm transition-colors",
                  active ? "border-cyan font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
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
