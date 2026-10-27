"use client";

import type { Playback, ProgressUpdate } from "@/lib/contracts/learning";

export type LessonAction = "start" | "heartbeat" | "complete" | "playback";

export interface ClientError {
  code: string;
  message: string;
}
export type ClientResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ClientError };

/**
 * Renews the access cookie through the refresh route handler. Browsers apply Set-Cookie on the
 * redirect response even though we don't follow it.
 */
async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh?next=/app", { redirect: "manual", credentials: "same-origin" });
    return res.type === "opaqueredirect" || res.ok;
  } catch {
    return false;
  }
}

/** Lesson events via the BFF (`/api/learn/lessons/:id/:action`); one retry after a token refresh. */
export async function lessonCall<T>(lessonId: string, action: LessonAction, body?: unknown, retried = false): Promise<ClientResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/learn/lessons/${lessonId}/${action}`, {
      method: action === "playback" ? "GET" : "POST",
      credentials: "same-origin",
      headers: action === "playback" ? {} : { "content-type": "application/json" },
      ...(action === "playback" ? {} : { body: JSON.stringify(body ?? {}) }),
    });
  } catch {
    return { ok: false, status: 0, error: { code: "NETWORK_ERROR", message: "You seem to be offline." } };
  }
  if (res.status === 401 && !retried && (await refreshSession())) return lessonCall<T>(lessonId, action, body, true);
  const json = (await res.json().catch(() => null)) as { data?: T; error?: ClientError } | null;
  if (res.ok && json?.data !== undefined) return { ok: true, data: json.data };
  return { ok: false, status: res.status, error: json?.error ?? { code: "INTERNAL_ERROR", message: "Something went wrong." } };
}

export const startLesson = (id: string) => lessonCall<{ watchSessionId: string | null; resumeAt: number; firstOpenedAt: string | null }>(id, "start", { client: "web" });
export const sendHeartbeat = (id: string, beat: { watchSessionId: string; position: number; rate: number; playing: boolean }) => lessonCall<ProgressUpdate>(id, "heartbeat", beat);
export const completeLesson = (id: string) => lessonCall<ProgressUpdate>(id, "complete");
export const fetchPlayback = (id: string) => lessonCall<Playback>(id, "playback");

/** Last-chance heartbeat when the tab closes; may be dropped by the browser, which is fine. */
export function beaconHeartbeat(id: string, beat: { watchSessionId: string; position: number; rate: number; playing: boolean }) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  navigator.sendBeacon(`/api/learn/lessons/${id}/heartbeat`, new Blob([JSON.stringify(beat)], { type: "application/json" }));
}
