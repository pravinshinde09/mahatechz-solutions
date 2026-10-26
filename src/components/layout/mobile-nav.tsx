"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ items, home }: { items: { href: string; label: string }[]; home: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="ml-auto md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-surface">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="grid gap-1 px-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={close} className="rounded-md px-3 py-3 hover:bg-surface-raised">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 grid gap-2 px-4">
          {home ? (
            <Button asChild size="lg">
              <Link href={home} onClick={close}>
                My dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/register" onClick={close}>
                  Get started
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login" onClick={close}>
                  Sign in
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
