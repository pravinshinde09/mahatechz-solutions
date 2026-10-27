"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { markReadAction } from "./actions";

export function NotificationLink({ id, href, unread, className, children }: { id: string; href: string; unread: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={className} onClick={() => (unread ? void markReadAction(id) : undefined)}>
      {children}
    </Link>
  );
}
