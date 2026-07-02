# FieldAsset QA Lab

A small, working demo of **how I would build QA from the ground up in an AI-enabled world** — wrapped around a realistic field-data workflow: messy CSV from a legacy panel schedule goes in, structured electrical asset records with row-level diagnostics and a report come out.

> **Point of view:** I use AI for speed — test design, edge-case discovery, fixture variation, log summarization, and documentation drafts. But acceptance criteria, deterministic regression tests, committed fixtures, and human release judgment stay the source of truth. AI drafts; humans decide.

This is a portfolio project inspired by field-data and asset-management workflows in general. It is not affiliated with any company, and all data is fictional.

## What the app simulates

A facility asset system used by an electrical field/service team:

1. **Facility list** — seeded facilities with status and critical-asset counts.
2. **Facility detail** — asset table with inline status editing and history.
3. **CSV import** — paste rows copied from a spreadsheet or legacy PDF. Valid rows import; invalid rows are rejected with the row number, field, and a plain-language reason (including "did you mean…?" hints for typos).
4. **Support diagnostics panel** — last import's source, counts, issues, suggested next actions, and an **AI-assisted customer reply draft** that cannot be copied until a human marks it reviewed.
5. **Report preview** — critical/needs-review/missing-inspection rollup, copy as text or download as JSON. Archived facilities are excluded.

Three committed CSV fixtures drive the demo (`src/test-fixtures/`): a clean file, a **broken customer-like panel schedule** (missing fields, `xfmr` type abbreviation, `criticl` typo, duplicates, stray whitespace, US-style date), and a critical-assets file. The same fixtures are loaded by the UI's sample buttons, the unit tests, and the Playwright suite — one source of truth for expected behavior.

## How I would build QA from the ground up

Quality is designed in from the first user story, not added after features are done:

```
user story → acceptance criteria → risk analysis → manual charter
→ deterministic automated test → support reproduction path
→ bug report → regression coverage → release confidence
```

Concretely, in this repo:

- **Acceptance criteria before tests** — [docs/traceability.md](docs/traceability.md) maps each user story to its risk, manual check, and automated test by name.
- **Risk-based coverage** — the import parser (highest risk: silent data loss) gets 20+ unit tests; UI flows get 14 Playwright tests; visual polish gets exploratory charters, not automation.
- **Deterministic by design** — the parser is a pure function; the report builder takes `now` as a parameter. Same input, same output, no flaky tests.
- **Support is a QA input** — [docs/support-reproduction.md](docs/support-reproduction.md) walks a customer ticket from report to root cause to the exact regression tests it produced. The broken fixture *is* the customer's file.
- **Release discipline** — [docs/release-checklist.md](docs/release-checklist.md) defines what must pass before shipping.

## AI-enabled QA approach

Detailed in [docs/ai-enabled-qa.md](docs/ai-enabled-qa.md) — the strongest statement of approach in this repo. The short version:

| AI accelerates | Humans own |
|---|---|
| Edge-case brainstorming, fixture variation | Which fixtures get committed and what "correct" means |
| Test skeleton drafts | Selectors, assertions, expected outcomes |
| Log/import-error summarization | Root-cause confirmation before filing a bug |
| Customer reply and bug report drafts | Review of tone and accuracy before sending |
| Coverage-gap suggestions after a bug | What becomes permanent regression coverage |

The guardrail is visible **in the product**: the diagnostics panel drafts a customer reply from import results, but the copy button is disabled until a human checks "I reviewed this draft" — and there is a Playwright test asserting that guardrail works.

This repo was itself built AI-assisted (agentic coding with a review gate on every change) — see [CLAUDE.md](CLAUDE.md) for the conventions that keep an AI agent productive and safe in this codebase.

## How to run

```bash
npm install
npm run dev        # http://localhost:5173
```

## How to run tests

```bash
npm run test:unit  # Vitest — 26 tests on the parser, report builder, fixtures
npm run test:e2e   # Playwright — 14 regression tests (first run: npx playwright install chromium)
npm test           # both
```

CI runs both suites on every push (`.github/workflows/ci.yml`).

## Documentation map

| Doc | What it shows |
|---|---|
| [docs/qa-strategy.md](docs/qa-strategy.md) | Risks, test pyramid, manual charters, automation policy |
| [docs/ai-enabled-qa.md](docs/ai-enabled-qa.md) | Building QA from the ground up in an AI-enabled world |
| [docs/support-reproduction.md](docs/support-reproduction.md) | Customer ticket → root cause → regression tests |
| [docs/bug-report-example.md](docs/bug-report-example.md) | Engineering handoff quality |
| [docs/release-checklist.md](docs/release-checklist.md) | What must pass before shipping |
| [docs/traceability.md](docs/traceability.md) | Stories → risks → manual checks → automated tests |

## What I would add next

- Import preview step (validate → review → commit) so customers can fix rows before anything imports.
- Downloadable "rejected rows" CSV so customers can fix and re-import only failures.
- Real LLM behind the reply drafter (BYO key), keeping the identical review gate.
- Playwright visual snapshots for report rendering; axe-core accessibility checks in CI.
- Contract tests on the exported JSON report schema.
