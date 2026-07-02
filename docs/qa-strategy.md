# QA Strategy

The strategy for this product is risk-first: identify what can hurt a customer, decide how each risk is best caught (unit test, e2e test, manual charter, or support telemetry), and automate the stable, high-value paths.

## Product Risks

Ranked by customer impact:

1. **Silent data loss on import** — a row fails to import and nobody notices. Worst case: a critical breaker is missing from the record and from the report. *Mitigation: every row is either imported or listed with a reason; totals must reconcile (total = accepted + rejected).*
2. **Wrong normalization** — `PANEL` and ` panel ` should be the same type; over-aggressive normalization could corrupt names. *Mitigation: unit tests pin exact trim/casing behavior; names are never case-modified, only compared case-insensitively.*
3. **Misleading report** — critical assets not highlighted, archived facilities leaking into customer-facing output. *Mitigation: e2e tests on report content; archived facilities are excluded by rule with a test.*
4. **Duplicate records** — the same asset imported twice destroys trust in counts. *Mitigation: duplicate checks within a file and against existing facility assets, both tested.*
5. **Unactionable errors** — "import failed" with no row/field/reason creates support tickets. *Mitigation: every error carries row number, field, and plain language; typos get "did you mean…?" hints.*
6. **Lost field edits** — a status change that doesn't persist means a technician's finding disappears. *Mitigation: e2e test edits status, reloads, and re-asserts.*

## Test Pyramid

| Layer | Count | What it covers | Why here |
|---|---|---|---|
| Unit (Vitest) | 26 | CSV parsing, validation rules, normalization, duplicates, warnings vs errors, report math, text export | The import engine is pure and deterministic — cheapest place to pin exact behavior |
| E2E (Playwright) | 14 | Facility CRUD, manual asset add, import happy/broken paths, diagnostics, report, persistence, AI-draft review gate | Proves the workflows a customer actually runs |
| Manual charters | ongoing | Layout, copy tone, exploratory abuse of the import box | Human judgment; not worth automating |

Deterministic by construction: the parser is a pure function, the report builder takes `now` as an injected parameter, and all test data comes from fixtures committed to the repo.

## Manual QA Charters

- **Charter 1 — Hostile paste:** paste JSON, HTML, a 5,000-row file, emoji, RTL text, and a single header row into the import box. Look for crashes, hangs, or errors that don't say what to fix.
- **Charter 2 — Real-world spreadsheet:** copy a table out of an actual spreadsheet app (tabs? smart quotes?) and observe whether the diagnostics would make sense to a non-technical office manager.
- **Charter 3 — Field conditions:** narrow viewport, glare-friendly contrast check, status editing with a touch target. Would a technician in a mechanical room get this right?
- **Charter 4 — Report skepticism:** import known data, generate the report, and reconcile every count by hand against the asset table.

## Automated Regression Coverage

Playwright tests live in `tests/e2e/` and are named as behavior statements (e.g. `rejects duplicate asset names within the same facility`). Policy:

- Locators prefer roles and labels; `data-testid` only where text is dynamic.
- No sleeps, no conditional assertions, no shared state between tests (each test gets a fresh browser context and deterministic seed data).
- Every support ticket that reveals a behavior gap ends as a named regression test — see [support-reproduction.md](support-reproduction.md).

## Import and Data Validation Risks

The riskiest code path gets the deepest coverage. Unit tests pin: required fields, unknown type/status rejection with suggestions, whitespace trimming, case normalization, duplicate detection (in-file and vs existing, case-insensitive), quoted-comma handling, column-count mismatches, missing header columns, empty input, header casing, warning/error separation, and fixture-level totals. The broken customer-like fixture (`broken-panel-schedule.csv`) is itself a regression artifact: its expected outcome (7 rows → 2 imported, 5 rejected, 1 warning) is asserted in both unit and e2e suites.

## Support Feedback Loop

```
ticket → reproduce with the customer's file → minimize to a fixture
→ decide: bug, missing validation, or docs gap → fix or file
→ add the fixture + a named regression test → close the loop with the customer
```

The demo's diagnostics panel exists to make step 1 fast: source label, counts, row-level issues, and suggested next actions are all in one place.

## AI-Enabled QA Approach

AI accelerates test design, data variation, log summarization, and first-draft documentation. It does not replace clear acceptance criteria, deterministic regression tests, or human judgment about release risk. Full treatment: [ai-enabled-qa.md](ai-enabled-qa.md).

## Human Review Guardrails

- AI never silently defines expected behavior; acceptance criteria are agreed with product first.
- AI-generated tests and fixtures are reviewed, then committed — never generated at test time.
- Automated tests must be deterministic and repeatable before they count as coverage.
- Customer-facing text is reviewed by a human before sending (enforced in the product UI itself).
- Release decisions weigh risk, evidence, and context — a green suite is necessary, not sufficient.
