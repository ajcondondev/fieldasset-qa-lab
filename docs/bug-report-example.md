# Bug Report Example

Example of the handoff quality I aim for. Based on the broken-import investigation in [support-reproduction.md](support-reproduction.md), written as if against a build where diagnostics were not yet surfaced inline.

---

**Title:** Import rejections are not visible next to the import summary, so failed rows look like silent data loss

**Environment:** FieldAsset QA Lab v0.1.0, local build `npm run dev`, Chromium 141 (Playwright bundle), Windows 11. Reproduces in a clean profile (fresh localStorage).

**Severity:** High — customers conclude that imported data was lost; equipment records appear incomplete without explanation.

**Priority:** P1 — blocks the onboarding workflow for any customer migrating legacy data, which is the primary first-week activity.

**Steps to reproduce:**

1. Open a facility → *Import assets from CSV*.
2. Load `src/test-fixtures/broken-panel-schedule.csv` (committed fixture, 7 data rows).
3. Click *Validate and import*.
4. Observe the summary and the asset table.

**Expected result:** Summary shows `7 rows — 2 imported, 5 rejected, 1 warning`, immediately followed by a rejected-rows table listing row number, field, and a plain-language reason for each of the 5 failures, with warnings listed separately.

**Actual result:** Summary shows counts only. The 5 rejection reasons are not visible anywhere in the UI; the customer sees 2 new assets and assumes the other 5 were lost.

**Evidence:** Fixture attached (`broken-panel-schedule.csv`); parser output verified via `parseAssetCsv` in a unit REPL — errors array contains all 5 rejections with correct row numbers (2, 3, 4, 5, 7), so the data exists and this is a presentation gap, not a validation gap.

**Suspected cause:** Import result state is captured but only the count fields are rendered; the `errors`/`warnings` arrays are never mapped into the panel.

**Suggested fix:** Render rejected rows and warnings as separate tables under the summary (error tone vs warning tone); repeat them in the support diagnostics panel with suggested next actions. Follow-up (separate ticket): offer a "download rejected rows as CSV" so customers can fix and re-import only the failures.

**Regression test recommendation:** E2E — load the broken fixture, import, assert the summary counts **and** the presence of each rejection reason (`tests/e2e/import.spec.ts › shows row-level diagnostics for a broken CSV import`). Unit — pin the fixture's exact error list so validation and presentation can't drift apart (`tests/unit/csv.test.ts`).
