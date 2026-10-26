import { describe, expect, it } from "vitest";
import { safeNext } from "../auth/safe-next";

describe("safeNext (open-redirect guard)", () => {
  it("keeps same-origin paths", () => {
    expect(safeNext("/app/courses?tab=done")).toBe("/app/courses?tab=done");
    expect(safeNext("/admin")).toBe("/admin");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    String.raw`/\evil.example`, // browsers treat "/\" like "//"
    "javascript:alert(1)",
    "app",
    "/api/auth/logout",
    "/app\n/evil",
    "",
    null,
    undefined,
  ])("falls back for %j", (value) => {
    expect(safeNext(value as string)).toBe("/app");
  });

  it("uses the given fallback", () => {
    expect(safeNext("//x", "/admin")).toBe("/admin");
  });
});
