"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ProgressUpdate } from "@/lib/contracts/learning";
import { beaconHeartbeat, sendHeartbeat } from "@/lib/learn-client";

/** Spec §15.5: every 30 s while playing, and on pause / seek / end. */
const INTERVAL_MS = 30_000;
/** Event-driven beats closer together than this are skipped (the server allows ~6 per minute). */
const MIN_GAP_MS = 8_000;

export interface PlayerSnapshot {
  position: number;
  rate: number;
  playing: boolean;
}

/**
 * Sends progress events for one watch session. The server decides what counts — the client only
 * reports where the playhead is. `read()` returns the player's current state.
 */
export function useHeartbeats(lessonId: string, watchSessionId: string | null, read: () => PlayerSnapshot | null, onUpdate: (u: ProgressUpdate) => void) {
  const lastSent = useRef(0);
  const inFlight = useRef(false);
  const readRef = useRef(read);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    readRef.current = read;
    onUpdateRef.current = onUpdate;
  });

  const pulse = useCallback(
    async (reason: "interval" | "pause" | "seek" | "ended", snapshot?: PlayerSnapshot) => {
      if (!watchSessionId || inFlight.current) return;
      const now = Date.now();
      if (reason !== "interval" && reason !== "ended" && now - lastSent.current < MIN_GAP_MS) return;
      const state = snapshot ?? readRef.current();
      if (!state) return;
      inFlight.current = true;
      lastSent.current = now;
      const res = await sendHeartbeat(lessonId, { watchSessionId, position: Math.max(0, state.position), rate: state.rate || 1, playing: state.playing });
      inFlight.current = false;
      // 429s and network errors are dropped: the next beat carries the position again.
      if (res.ok) onUpdateRef.current(res.data);
    },
    [lessonId, watchSessionId],
  );

  useEffect(() => {
    if (!watchSessionId) return;
    const timer = window.setInterval(() => {
      if (readRef.current()?.playing) void pulse("interval");
    }, INTERVAL_MS);
    const onHide = () => {
      const state = readRef.current();
      if (state && document.visibilityState === "hidden") beaconHeartbeat(lessonId, { watchSessionId, position: state.position, rate: state.rate || 1, playing: false });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [lessonId, watchSessionId, pulse]);

  return pulse;
}
