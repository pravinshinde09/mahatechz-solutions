import "server-only";
import { cache } from "react";
import { authedRequest } from "@/lib/api/server";
import type { LearnCourse } from "@/lib/contracts/learning";

/** The player's syllabus, deduplicated between layout-level and page-level reads. */
export const getLearnCourse = cache((slug: string) => authedRequest<LearnCourse>(`/learn/courses/${encodeURIComponent(slug)}`));
