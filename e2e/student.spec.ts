import { expect, test, type Page } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, need, signIn } from "./support";

const lesson = (id: string) => `/app/learn/${need("E2E_COURSE_SLUG")}/${id}`;

async function signInStudent(page: Page) {
  await signIn(page, need("E2E_STUDENT_EMAIL"), need("E2E_PASSWORD"));
  await page.waitForURL((u) => u.pathname === "/app");
}

// The critical learning journey (spec §27.1): lessons → quiz → completion → automatic certificate.
// Runs once per suite on desktop; the fixtures script resets the student's progress beforehand.
test("a student completes the course and receives the certificate", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "stateful journey runs once, on desktop");
  test.setTimeout(300_000);
  await signInStudent(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page);

  for (const id of [need("E2E_ARTICLE_LESSON_ID"), need("E2E_RESOURCE_LESSON_ID")]) {
    await page.goto(lesson(id));
    const complete = page.getByRole("button", { name: "Mark as complete" });
    // Articles open "Mark as complete" after the minimum reading time (seconds for this fixture).
    await expect(complete).toBeEnabled({ timeout: 45_000 });
    await complete.click();
    await expect(page.getByText(/Lesson complete|Course complete/).first()).toBeVisible();
  }

  await page.goto(`/app/learn/${need("E2E_COURSE_SLUG")}/quiz/${need("E2E_QUIZ_LESSON_ID")}`);
  await page.getByRole("button", { name: /Start (quiz|another attempt)/ }).click();
  await page.getByLabel("Direct-on-line").check();
  await page.getByRole("button", { name: /Next/ }).click();
  await page.getByLabel("Your answer").fill("415");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText(/Passed —/)).toBeVisible();
  await expect(page.getByText(/completed the course/)).toBeVisible();

  // Auto-issue runs as a background job: poll the certificates page.
  await expect(async () => {
    await page.goto("/app/certificates");
    await expect(page.getByText(/MZT-E2E-\d{4}-\d{6}/)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 90_000, intervals: [3_000] });
  await expectAccessible(page);
});

test("student pages work on this screen size", async ({ page }) => {
  test.setTimeout(240_000);
  await signInStudent(page);
  for (const path of ["/app", "/app/progress", "/app/certificates", `/app/learn/${need("E2E_COURSE_SLUG")}/${need("E2E_ARTICLE_LESSON_ID")}`]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
  }
});
