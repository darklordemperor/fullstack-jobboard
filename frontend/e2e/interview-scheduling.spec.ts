import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("employer schedules, conflict is rejected, and candidate confirms responsively", async ({ page }) => {
  await signIn(page, "seeker@jobboard.com");
  await expect(page).toHaveURL(/\/jobseeker\/browse$/);

  await page.getByRole("button", { name: "Save job" }).first().click();
  await expect(page.getByRole("button", { name: "Remove bookmark" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("link", { name: "View role" }).first().click();
  await expect(page).toHaveURL(/\/jobseeker\/browse\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saved job" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const jobId = new URL(page.url()).pathname.split("/").pop();
  expect(jobId).toMatch(/^\d+$/);

  await page.getByLabel("Cover letter").fill(
    "I have relevant experience building reliable backend systems and collaborating with product teams. I would welcome the opportunity to discuss this role.",
  );
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("status")).toContainText("Application submitted");

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, "employer@jobboard.com");
  await expect(page).toHaveURL(/\/employer\/jobs$/);
  await expect(page.getByLabel("Search owned job listings")).toBeVisible();
  await expect(page.getByRole("region", { name: "Job listings" })).toBeVisible();
  await expect(page.getByText(/\d+ applicants?/).first()).toBeVisible();

  await page.getByRole("button", { name: "Close", exact: true }).first().click();
  const confirmDialog = page.getByRole("dialog", { name: "Close job listing?" });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(confirmDialog).toBeHidden();

  await page.goto(`/employer/jobs/${jobId}/applicants`);

  await page.getByPlaceholder("Search name, email, or cover letter…").fill("Seeker User");
  await expect(page.getByText("seeker@jobboard.com")).toBeVisible();

  await page.getByLabel("Update Seeker User application status").selectOption("shortlisted");
  await expect(page.getByRole("button", { name: "Send interview invitation" })).toBeVisible();

  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  future.setUTCHours(10, 0, 0, 0);
  const localDateTime = future.toISOString().slice(0, 16);

  await page.getByLabel("Date and time").fill(localDateTime);
  await page.getByLabel("Duration").selectOption("60");
  await page.getByLabel("Meeting link or location").fill("https://meet.example/e2e-interview");
  await page.getByLabel("Candidate notes").fill("Bring one recent system design example.");
  await page.getByRole("button", { name: "Send interview invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Interview scheduled");

  await page.getByRole("button", { name: "Send interview invitation" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "overlapping interview" })).toBeVisible();

  const workspaceNav = page.getByRole("navigation", { name: "Workspace navigation" });
  await workspaceNav.getByRole("link", { name: "Interviews", exact: true }).click();
  await expect(page).toHaveURL(/\/employer\/interviews$/);
  await expect(page.getByRole("heading", { name: "Interview schedule" })).toBeVisible();
  await expect(page.getByText("Seeker User", { exact: true })).toBeVisible();
  await expect(page.locator("span").filter({ hasText: /^Awaiting confirmation$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to calendar (.ics)" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, "seeker@jobboard.com");
  await expect(page).toHaveURL(/\/jobseeker\/browse$/);
  await expect(page.getByRole("button", { name: "Remove bookmark" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /Saved only/ }).click();
  await expect(page.getByText("Saved jobs view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1 saved jobs" })).toBeVisible();

  await page.goto(`/jobseeker/browse/${jobId}`);
  await expect(page.getByRole("status")).toContainText("Application on file");
  await expect(page.getByRole("status")).toContainText("Shortlisted");

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/jobseeker\/browse$/);

  await page.getByRole("button", { name: "Account settings", exact: true }).click();
  const accountDialog = page.getByRole("dialog", { name: "Account settings" });
  await expect(accountDialog).toBeVisible();
  await accountDialog.getByLabel("Full name").fill("Seeker User Updated");
  await accountDialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(accountDialog.getByRole("status")).toContainText("Account profile updated.");
  await accountDialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(accountDialog).toBeHidden();
  await expect(page.getByText("Seeker User Updated", { exact: true })).toBeVisible();

  await workspaceNav.getByRole("link", { name: "My interviews", exact: true }).click();
  await expect(page).toHaveURL(/\/jobseeker\/interviews$/);
  await expect(page.locator("span").filter({ hasText: /^Action required$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to calendar (.ics)" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Confirm attendance" }).click();
  await expect(page.locator("span").filter({ hasText: /^Confirmed$/ })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "My interviews" })).toBeVisible();
  await expect(page.locator("span").filter({ hasText: /^Confirmed$/ })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});
