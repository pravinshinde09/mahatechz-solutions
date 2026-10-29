import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, need, signIn } from "./support";

// AC-01 (spec §32): visitors browse, search and view course details without logging in.
test("home, catalogue and course details work without an account and are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page);
  await expectNoHorizontalScroll(page);

  await page.goto("/courses?q=panel");
  await expect(page.getByRole("link", { name: /E2E Panel Wiring Basics/ }).first()).toBeVisible();
  await expectAccessible(page);
  await expectNoHorizontalScroll(page);

  await page.goto(`/courses/${need("E2E_COURSE_SLUG")}`);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Panel Wiring Basics" })).toBeVisible();
  await expectAccessible(page);
  await expectNoHorizontalScroll(page);
});

// Spec §29.1 / §29.7: every policy page is live, linked from the footer and accessible.
test("policy pages are reachable from the footer and accessible", async ({ page }) => {
  const pages = ["/terms", "/privacy", "/refund-policy", "/course-access-policy", "/certificate-policy", "/cookies", "/accessibility"];
  await page.goto("/");
  const footer = page.locator("footer");
  for (const path of pages) await expect(footer.locator(`a[href="${path}"]`)).toHaveCount(1);
  await expect(footer.getByText(/not affiliated with or endorsed by Autodesk/)).toBeVisible();
  for (const path of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalScroll(page);
  }
});

// T-27 in the browser: minimal fields, not indexed.
test("certificate verification shows only what the certificate says", async ({ page }) => {
  await page.goto(`/verify/${need("E2E_CERT_CODE").toLowerCase()}`);
  await expect(page.getByText("Valid certificate")).toBeVisible();
  await expect(page.getByText("Aman Joshi")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("@");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectAccessible(page);
  await expectNoHorizontalScroll(page);

  await page.goto("/verify/ZZZZZZZZZZ");
  await expect(page.getByText("No certificate found")).toBeVisible();
});

test("sign-in rejects a wrong password without saying which part was wrong", async ({ page }) => {
  await signIn(page, need("E2E_STUDENT_EMAIL"), "not-the-right-password-1");
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expectAccessible(page);
});

test("protected areas send visitors to sign in", async ({ page }) => {
  await page.goto("/app/certificates");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fcertificates/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

// Spec §18.3 header controls on a real response.
test("pages carry the security headers", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});
