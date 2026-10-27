"use server";

import { authedRequest } from "@/lib/api/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Records the join click (an activity signal) and returns the meeting link if the window is open. */
export async function joinLiveAction(id: string): Promise<{ url: string } | { error: string }> {
  if (!UUID.test(id)) return { error: "Unknown class." };
  const res = await authedRequest<{ url: string }>(`/live-sessions/${id}/join`, { method: "POST" });
  return res.ok ? res.data : { error: res.error.message };
}
