import { expect, test } from "@playwright/test";
import { expectAccessible, need, signIn, totp } from "./support";

// Staff sign-in with mandatory TOTP, then the key admin pages (spec §22.3), each axe-checked.
test("an admin signs in with 2FA and the key admin pages are accessible", async ({ page }) => {
  test.setTimeout(300_000);
  await signIn(page, need("E2E_ADMIN_EMAIL"), need("E2E_PASSWORD"), "/admin");
  await page.waitForURL(/\/login\/2fa/);
  await page.getByRole("textbox").first().fill(totp(need("E2E_ADMIN_TOTP_SECRET")));
  await page.getByRole("button", { name: /verify|continue|sign in/i }).click();
  await page.waitForURL((u) => u.pathname === "/admin");

  await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible();
  await expect(page.getByText("Course completion rate")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/admin/certificates");
  await expect(page.getByText(/MZT-E2E-/).first()).toBeVisible();
  await expectAccessible(page);

  for (const path of ["/admin/certificates/eligible", "/admin/certificates/templates", "/admin/reports", "/admin/courses", "/admin/enrollments"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectAccessible(page);
  }
});

test("a student is kept out of the admin area", async ({ page }) => {
  await signIn(page, need("E2E_STUDENT_EMAIL"), need("E2E_PASSWORD"));
  await page.waitForURL((u) => u.pathname === "/app");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin dashboard" })).toHaveCount(0);
});
