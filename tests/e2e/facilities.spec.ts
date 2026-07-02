import { expect, test } from "@playwright/test";

// Each Playwright test runs in a fresh browser context, so localStorage is
// empty and the app seeds its deterministic demo data on first load.

test("loads the facility list with seeded facilities", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Facilities" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Northside Medical Office" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Granite Street Warehouse" })).toBeVisible();
  // Archived facilities render but are visually de-emphasized.
  const archived = page.locator("article", { hasText: "Elm Street Manufacturing" });
  await expect(archived).toHaveClass(/facility-archived/);
});

test("creates a facility and displays it in the facility list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New facility" }).click();
  await page.getByLabel("Facility name *").fill("Riverside Clinic");
  await page.getByLabel("Customer name *").fill("Example Facilities Group");
  await page.getByRole("button", { name: "Create facility" }).click();
  await expect(page.getByRole("heading", { name: "Riverside Clinic" })).toBeVisible();
  await expect(page.locator("article", { hasText: "Riverside Clinic" })).toContainText("0 assets");
});

test("requires facility name and customer name with clear messages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New facility" }).click();
  await page.getByRole("button", { name: "Create facility" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Facility name is required.");
  await expect(alert).toContainText("Customer name is required.");
});

test("adds an electrical asset to a facility", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("article", { hasText: "Northside Medical Office" })
    .getByRole("link", { name: "Open facility" })
    .click();
  await expect(page.getByRole("heading", { name: "Northside Medical Office" })).toBeVisible();

  const form = page.getByRole("form", { name: "Add asset" });
  await form.getByLabel("Asset name *").fill("Panel E");
  await form.getByLabel("Type *").selectOption("panel");
  await form.getByLabel("Location *").fill("Electrical room 2");
  await form.getByRole("button", { name: "Add asset" }).click();

  await expect(page.getByRole("status")).toContainText('Added "Panel E".');
  await expect(page.getByRole("row", { name: /Panel E/ })).toBeVisible();
});

test("edits asset status and persists it across a reload", async ({ page }) => {
  await page.goto("/#/facility/fac-northside");
  await page.getByLabel("Status for Panel A").selectOption("critical");
  // Anchor on the name cell: "Panel A" also appears as Breaker 12's location.
  const panelARow = page.locator("tr", { has: page.locator("td.cell-name", { hasText: "Panel A" }) });
  await expect(panelARow).toContainText("Critical");

  await page.reload();
  await expect(page.getByLabel("Status for Panel A")).toHaveValue("critical");
  await expect(panelARow).toContainText("Critical");
});
