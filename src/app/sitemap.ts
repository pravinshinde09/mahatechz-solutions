import type { MetadataRoute } from "next";
import { apiRequest } from "@/lib/api/server";
import { env } from "@/lib/env";

/** Public pages + every published course (spec FR-CAT-06). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.WEB_APP_URL;
  const staticPages = ["", "/courses", "/about", "/contact"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const }));
  const courses = await apiRequest<{ slug: string; updatedAt: string }[]>("/sitemap/courses");
  return [
    ...staticPages,
    ...(courses.ok ? courses.data.map((c) => ({ url: `${base}/courses/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const })) : []),
  ];
}
