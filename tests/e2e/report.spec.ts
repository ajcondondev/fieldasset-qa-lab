import { expect, test } from "@playwright/test";

test("generates a report that highlights critical assets", async ({ page }) => {
  await page.goto("/#/facility/fac-northside");
  await page.getByRole("button", { name: "Generate report" }).click();

  const report = page.getByTestId("report");
  await expect(report).toContainText("Northside Medical Office");
  await expect(page.getByTestId("report-counts")).toContainText("4 assets");
  await expect(page.getByTestId("report-counts")).toContainText("1 critical");
  await expect(report.getByRole("heading", { name: /Critical assets \(1\)/ })).toBeVisible();
  await expect(report).toContainText("Breaker 12");
});

test("report reflects newly imported assets", async ({ page }) => {
  await page.goto("/#/facility/fac-granite");
  await page.getByRole("button", { name: "critical-assets.csv" }).click();
  await page.getByRole("button", { name: "Validate and import" }).click();
  await expect(page.getByTestId("import-summary")).toContainText("3 imported");

  await page.getByRole("button", { name: "Generate report" }).click();
  const report = page.getByTestId("report");
  await expect(report.getByRole("heading", { name: /Critical assets \(1\)/ })).toBeVisible();
  await expect(report).toContainText("Service Entrance Switchgear");
  await expect(report.getByRole("heading", { name: /Needs review \(2\)/ })).toBeVisible();
});

test("archived facilities are excluded from customer-facing reports", async ({ page }) => {
  await page.goto("/#/facility/fac-elm");
  const report = page.getByTestId("report");
  await expect(report).toContainText("Archived facilities are excluded from customer-facing reports.");
  await expect(report.getByRole("button", { name: "Generate report" })).toHaveCount(0);
});
