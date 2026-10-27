"use server";

import { revalidatePath } from "next/cache";
import { authedRequest } from "@/lib/api/server";

export async function markAllReadAction(): Promise<void> {
  await authedRequest("/me/notifications/read", { method: "POST", body: { all: true } });
  revalidatePath("/app", "layout");
}

/** Marks one notification read on click, then the link navigates as usual. */
export async function markReadAction(id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await authedRequest("/me/notifications/read", { method: "POST", body: { ids: [id] } });
  revalidatePath("/app", "layout");
}
