# Release Checklist

A release is a risk decision, not a green checkmark. This list is what I verify before shipping; anything unchecked is either fixed or explicitly accepted as a known issue in the release notes.

## Before Release

- [ ] Core workflows pass a manual run-through: create facility → add asset → import CSV → review diagnostics → generate report.
- [ ] `npm run test:unit` — all Vitest suites pass (import validation, report math).
- [ ] `npm run test:e2e` — all Playwright regression tests pass, zero retries needed locally.
- [ ] The broken customer-like fixture (`broken-panel-schedule.csv`) still produces exactly: 7 rows → 2 imported, 5 rejected, 1 warning, with correct row numbers.
- [ ] Report preview highlights critical assets and flags missing inspection dates.
- [ ] No archived facility can produce a customer-facing report.
- [ ] Every validation message read aloud makes sense to a non-technical office manager.
- [ ] Status edits persist across reload.
- [ ] Known issues are written down, each with severity and a workaround.

## AI-Enabled QA Checks

- [ ] All AI-generated test ideas used this cycle were reviewed; rejected ones were not committed.
- [ ] AI-drafted bug reports were verified against actual reproduction steps before filing.
- [ ] No AI-suggested "expected behavior" was accepted without confirming against acceptance criteria.
- [ ] All test fixtures are deterministic files committed to the repo — nothing generated at test time.
- [ ] The customer-reply review gate still blocks unreviewed drafts (covered by `AI-assisted support draft requires human review before it can be copied`).

## Sign-off

- [ ] QA owner states remaining risk in one paragraph and makes a ship/hold recommendation.
