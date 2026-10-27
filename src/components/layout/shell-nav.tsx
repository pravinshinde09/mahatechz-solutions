"use client";

import {
  BookOpen,
  FolderTree,
  GraduationCap,
  Images,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Icons are referenced by name: components can't be passed from Server to Client Components.
const icons = { dashboard: LayoutDashboard, courses: BookOpen, settings: Settings, staff: Users, security: ShieldCheck, learn: GraduationCap, categories: FolderTree, media: Images } satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof icons;
export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Match only the exact path (for section roots like /app). */
  exact?: boolean;
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-1">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-[120ms]",
                active
                  ? "bg-surface-raised font-medium text-foreground shadow-glow before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-cyan"
                  : "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav aria-label={label}>
      <NavList items={items} />
    </nav>
  );
}

export function MobileShellNav({ items, label }: { items: NavItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-surface">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <nav aria-label={label} className="px-3">
          <NavList items={items} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
