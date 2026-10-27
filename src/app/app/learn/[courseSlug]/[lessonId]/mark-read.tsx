"use client";

import { useEffect } from "react";
import { markAnnouncementsReadAction } from "../../actions";

/** Rendered inside the Announcements tab, which mounts only when opened: opening it marks them read. */
export function MarkAnnouncementsRead({ course }: { course: string }) {
  useEffect(() => {
    void markAnnouncementsReadAction(course);
  }, [course]);
  return null;
}
