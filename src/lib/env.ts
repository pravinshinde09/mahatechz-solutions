import "server-only";
import { z } from "zod";

// Server-only configuration. The web server never holds database or provider secrets (spec §18.5).
const schema = z.object({
  API_INTERNAL_URL: z.url().default("http://localhost:4000"),
  /** Browser-facing API origin (local media URLs in development). */
  API_PUBLIC_URL: z.url().default("http://localhost:4000"),
  WEB_APP_URL: z.url().default("http://localhost:3000"),
  /** Same value as the API's BFF_SHARED_SECRET: lets the API rate-limit by the visitor's IP, not ours. */
  BFF_SHARED_SECRET: z.string().min(32).optional(),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid web environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
}
if (process.env.NODE_ENV === "production" && !parsed.data.COOKIE_SECURE && !parsed.data.WEB_APP_URL.startsWith("http://localhost")) {
  throw new Error("COOKIE_SECURE must be true outside localhost");
}

export const env = parsed.data;
