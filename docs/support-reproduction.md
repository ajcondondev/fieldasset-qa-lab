# Support Reproduction: Legacy Panel Schedule Import

How a customer ticket becomes a fixture, a root cause, and permanent regression coverage.

## 1. Customer-facing summary

A facilities customer reports that a technician copied a legacy panel schedule out of an old PDF into the CSV import tool. "Most of it went in, but some equipment is missing, the report doesn't show our bad breaker, and we can't tell which rows failed or why."

## 2. Reproduction steps

1. Obtain the customer's pasted text (or the minimized equivalent: `src/test-fixtures/broken-panel-schedule.csv`).
2. Open **Granite Street Warehouse → Import assets from CSV**.
3. Click **Load sample file → broken-panel-schedule.csv** (loads the exact fixture).
4. Click **Validate and import**.

## 3. Expected result

Every row either imports or appears in the rejected list with its row number, the failing field, and a reason a non-technical office manager can act on. Summary totals reconcile: total = imported + rejected.

## 4. Actual result (reproduced)

`7 rows — 2 imported, 5 rejected, 1 warning`, with row-level reasons:

| Row | Field | Reason |
|---|---|---|
| 2 | assetName | Asset name is required |
| 3 | type | `xfmr` is not a recognized asset type |
| 4 | location | Location is required |
| 5 | status | `criticl` is not a recognized status — did you mean `critical`? |
| 7 | assetName | `Panel D` appears more than once in this file |

Row 6 (` Panel D `/` PANEL `/` OK `) imported after trim/normalization; row 8 imported with a warning that `05/10/2024` is not a valid date.

## 5. Root cause notes

- The product behavior is **correct**: rejecting is right, and the diagnostics identify every failure. The customer's actual pain was **discoverability** — in their version, the failure list wasn't shown next to the import box, so "missing equipment" looked like data loss.
- Secondary finding: `xfmr` is a very common legacy abbreviation. Rejecting it is defensible (we should not guess at electrical equipment types), but the message should — and now does — list the valid types so the fix is self-service.

## 6. Product/engineering handoff

Filed as [bug-report-example.md](bug-report-example.md): keep rejection behavior, surface diagnostics inline with the import summary, add "did you mean" suggestions for near-miss typos, and suggest a follow-up feature (downloadable rejected-rows CSV).

## 7. Regression tests added

- Unit: `produces the expected diagnostics for the broken customer-like fixture` (`tests/unit/csv.test.ts`) — pins the exact error list (row + field) for the fixture.
- E2E: `shows row-level diagnostics for a broken CSV import` (`tests/e2e/import.spec.ts`) — asserts the on-screen summary, each rejection reason, the warning separation, and the diagnostics panel's next actions.

The customer's file (minimized, anonymized) is now a committed fixture, so this behavior can never regress silently.

## 8. Suggested support response

Drafted by the in-app **AI-assisted customer reply** tool from the diagnostics, then human-reviewed:

> Hi — thanks for sending the panel schedule. 2 of the 7 rows imported; 5 were held back, and nothing was lost. Row 2 is missing an asset name, row 3 uses "xfmr" (our importer needs "transformer"), row 4 is missing a location, row 5 has a typo ("criticl" → "critical"), and "Panel D" was pasted twice. If you update those five rows and re-import just that file, everything will be in. Happy to hop on a call and fix them together.
