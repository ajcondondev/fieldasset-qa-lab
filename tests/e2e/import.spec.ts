import { expect, test } from "@playwright/test";

const HEADER = "assetName,type,location,status,parentAssetName,lastInspectionDate,notes";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/facility/fac-granite");
  await expect(page.getByRole("heading", { name: "Granite Street Warehouse" })).toBeVisible();
});

test("imports valid CSV rows and displays the imported assets", async ({ page }) => {
  await page.getByRole("button", { name: "valid-assets.csv" }).click();
  await page.getByRole("button", { name: "Validate and import" }).click();

  await expect(page.getByTestId("import-summary")).toContainText("5 rows");
  await expect(page.getByTestId("import-summary")).toContainText("5 imported");
  await expect(page.getByTestId("import-summary")).toContainText("0 rejected");
  await expect(page.getByRole("row", { name: /Roof Transformer/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Distribution Switchgear/ })).toBeVisible();
});

test("shows row-level diagnostics for a broken CSV import", async ({ page }) => {
  await page.getByRole("button", { name: "broken-panel-schedule.csv" }).click();
  await page.getByRole("button", { name: "Validate and import" }).click();

  await expect(page.getByTestId("import-summary")).toContainText("7 rows");
  await expect(page.getByTestId("import-summary")).toContainText("2 imported");
  await expect(page.getByTestId("import-summary")).toContainText("5 rejected");

  const errors = page.getByTestId("import-errors");
  await expect(errors).toContainText("Asset name is required");
  await expect(errors).toContainText('"xfmr" is not a recognized asset type');
  await expect(errors).toContainText("Location is required");
  await expect(errors).toContainText('Did you mean "critical"?');
  await expect(errors).toContainText('"Panel D" appears more than once');

  // Warnings are separated from errors: the US-style date imports with a note.
  await expect(page.getByTestId("import-warnings")).toContainText("not a valid date");

  // The diagnostics panel translates failures into support next actions.
  const diagnostics = page.getByTestId("diagnostics");
  await expect(diagnostics).toContainText("broken-panel-schedule.csv");
  await expect(diagnostics).toContainText("Suggested next actions");
  await expect(diagnostics).toContainText("Confirm unrecognized asset types with the customer");
});

test("normalizes whitespace and asset type casing during import", async ({ page }) => {
  await page
    .getByLabel("CSV input")
    .fill(`${HEADER}\n  Panel Z  ,  PANEL  ,  Electrical room 4  ,  OK  ,,2025-06-01,`);
  await page.getByRole("button", { name: "Validate and import" }).click();

  await expect(page.getByTestId("import-summary")).toContainText("1 imported");
  const row = page.getByRole("row", { name: /Panel Z/ });
  await expect(row).toContainText("panel");
  await expect(row).toContainText("Electrical room 4");
});

test("rejects duplicate asset names within the same facility", async ({ page }) => {
  // "Main Meter" is seeded in Granite Street Warehouse.
  await page.getByLabel("CSV input").fill(`${HEADER}\nMain Meter,meter,Loading dock wall,ok,,2025-06-01,`);
  await page.getByRole("button", { name: "Validate and import" }).click();

  await expect(page.getByTestId("import-summary")).toContainText("0 imported");
  await expect(page.getByTestId("import-summary")).toContainText("1 rejected");
  await expect(page.getByTestId("import-errors")).toContainText(
    'An asset named "Main Meter" already exists in this facility.',
  );
  // Still exactly one Main Meter row in the asset table (the error table also mentions the name).
  await expect(page.locator("table.asset-table").getByRole("row", { name: /Main Meter/ })).toHaveCount(1);
});

test("AI-assisted support draft requires human review before it can be copied", async ({ page }) => {
  await page.getByRole("button", { name: "broken-panel-schedule.csv" }).click();
  await page.getByRole("button", { name: "Validate and import" }).click();
  await page.getByRole("button", { name: "Draft customer reply" }).click();

  const draft = page.getByTestId("support-draft");
  await expect(draft.getByLabel("Support reply draft")).toHaveValue(
    /2 of 7 rows imported successfully/,
  );
  // Guardrail: the copy action is locked until a human confirms review.
  const copyButton = draft.getByRole("button", { name: "Copy reviewed reply" });
  await expect(copyButton).toBeDisabled();
  await draft.getByLabel("I reviewed this draft for accuracy and tone").check();
  await expect(copyButton).toBeEnabled();
});

test("rejects a file with a missing required header column", async ({ page }) => {
  await page.getByLabel("CSV input").fill("assetName,location\nPanel Q,Room 1");
  await page.getByRole("button", { name: "Validate and import" }).click();

  await expect(page.getByTestId("import-summary")).toContainText("0 imported");
  await expect(page.getByTestId("import-errors")).toContainText("Missing required column(s): type, status");
});
