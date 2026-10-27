"use client";

import { Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { joinLiveAction } from "@/app/app/live/actions";

const opensFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * Join is enabled only inside the window (the API withholds the link until then, T-26). The page
 * refreshes itself when the window opens so the link appears without a reload.
 */
export function JoinButton({ id, joinOpen, joinOpensAt, endsAt, size = "default" }: { id: string; joinOpen: boolean; joinOpensAt: string; endsAt: string; size?: "default" | "sm" | "lg" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const opensIn = Date.parse(joinOpensAt) - Date.now();
    const endsIn = Date.parse(endsAt) - Date.now();
    const wait = !joinOpen && opensIn > 0 ? opensIn : joinOpen && endsIn > 0 ? endsIn : null;
    // Timers beyond ~24 days overflow; such sessions refresh on the next visit anyway.
    if (wait === null || wait > 2_000_000_000) return;
    const timer = window.setTimeout(() => router.refresh(), wait + 1000);
    return () => window.clearTimeout(timer);
  }, [joinOpen, joinOpensAt, endsAt, router]);

  // Only rendered for upcoming classes, so a closed window means it hasn't opened yet.
  if (!joinOpen) {
    return (
      <Button size={size} variant="outline" disabled>
        <Video /> Join opens {opensFmt.format(new Date(joinOpensAt))}
      </Button>
    );
  }
  return (
    <div className="grid gap-1">
      <Button
        size={size}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await joinLiveAction(id);
          setBusy(false);
          if ("error" in res) return setError(res.error);
          // Same tab: opening a window after an await is blocked by popup blockers.
          window.location.assign(res.url);
        }}
      >
        <Video /> {busy ? "Opening…" : "Join class"}
      </Button>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
