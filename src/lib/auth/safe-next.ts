/**
 * Validates a post-login redirect target: same-origin absolute paths only, so `?next=` can never
 * send a user to another site (open redirect).
 */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  if (next.startsWith("/api/")) return fallback;
  return next;
}
