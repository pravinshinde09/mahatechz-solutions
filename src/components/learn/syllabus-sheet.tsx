"use client";

import { ListTree } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** On small screens the syllabus becomes a bottom sheet (spec §14.2). */
export function SyllabusSheet({ children, progress }: { children: ReactNode; progress: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-between lg:hidden">
          <span className="inline-flex items-center gap-2">
            <ListTree /> Syllabus
          </span>
          <span className="font-mono text-xs tabular text-muted-foreground">{progress}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>Syllabus</SheetTitle>
        </SheetHeader>
        {/* Close after choosing a lesson (clicks on links bubble up here). */}
        <div className="px-4 pb-6" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
