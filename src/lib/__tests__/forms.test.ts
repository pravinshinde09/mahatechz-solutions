import { describe, expect, it } from "vitest";
import { registerRequestSchema } from "../contracts/auth";
import { fromApi, fromZod } from "../forms";

describe("form state mapping", () => {
  it("turns Zod issues into one friendly message per field", () => {
    const parsed = registerRequestSchema.safeParse({ fullName: "A", email: "nope", password: "short", acceptTerms: false });
    expect(parsed.success).toBe(false);
    const state = fromZod(parsed.error!, { email: "nope" });
    expect(state.status).toBe("error");
    expect(state.fieldErrors).toMatchObject({
      email: "Enter a valid email address.",
      password: "Use at least 10 characters.",
      acceptTerms: "Please accept the terms to continue.",
    });
    expect(state.values).toEqual({ email: "nope" });
  });

  it("rejects unknown fields such as role, matching the API (T-05)", () => {
    const parsed = registerRequestSchema.safeParse({ fullName: "Asha", email: "a@b.co", password: "long-enough-pass", acceptTerms: true, role: "ADMIN" });
    expect(parsed.success).toBe(false);
  });

  it("maps API field details and rate limits", () => {
    const weak = fromApi({ code: "VALIDATION_FAILED", message: "This password is too common.", details: [{ path: "body.password", issue: "x" }] });
    expect(weak.fieldErrors).toEqual({ password: "This password is too common." });
    expect(fromApi({ code: "RATE_LIMITED", message: "Too many" }).message).toMatch(/wait a few minutes/);
  });
});
