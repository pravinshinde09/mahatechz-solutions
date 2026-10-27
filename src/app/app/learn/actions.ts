"use server";

import { authedRequest } from "@/lib/api/server";

export async function markAnnouncementsReadAction(course: string): Promise<void> {
  if (!/^[a-z0-9-]{3,140}$/i.test(course)) return;
  await authedRequest(`/learn/courses/${course}/announcements/read`, { method: "POST" });
}
