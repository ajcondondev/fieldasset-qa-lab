# FieldAsset QA Lab

A small, working demo of **how I would build QA from the ground up in an AI-enabled world** — wrapped around a realistic field-data workflow: messy CSV from a legacy panel schedule goes in, structured electrical asset records with row-level diagnostics and a report come out.

> **Point of view:** I use AI for speed — test design, edge-case discovery, fixture variation, log summarization, and documentation drafts. But acceptance criteria, deterministic regression tests, committed fixtures, and human release judgment stay the source of truth. AI drafts; humans decide.

This is a portfolio project inspired by field-data and asset-management workflows in general. It is not affiliated with any company, and all data is fictional.

![Row-level import diagnostics for a broken customer CSV](docs/images/import-diagnostics.png)

*The core demo: a legacy panel schedule with seven distinct failure modes — every row either imports or explains itself. Errors block; warnings don't; typos get suggestions.*

## What the app simulates

A facility asset system used by an electrical field/service team:

1. **Facility list** — seeded facilities with status and critical-asset counts.
2. **Facility detail** — asset table with inline status editing and history.
3. **CSV import** — paste rows copied from a spreadsheet or legacy PDF. Valid rows import; invalid rows are rejected with the row number, field, and a plain-language reason (including "did you mean…?" hints for typos).
4. **Support diagnostics panel** — last import's source, counts, issues, suggested next actions, and an **AI-assisted customer reply draft** that cannot be copied until a human marks it reviewed.
5. **Report preview** — critical/needs-review/missing-inspection rollup, copy as text or download as JSON. Archived facilities are excluded.

Three committed CSV fixtures drive the demo (`src/test-fixtures/`): a clean file, a **broken customer-like panel schedule** (missing fields, `xfmr` type abbreviation, `criticl` typo, duplicates, stray whitespace, US-style date), and a critical-assets file. The same fixtures are loaded by the UI's sample buttons, the unit tests, and the Playwright suite — one source of truth for expected behavior.

## Demo walkthrough (2 minutes)

1. `npm install && npm run dev`, open http://localhost:5173.
2. Open **Granite Street Warehouse** → scroll to **Import assets from CSV**.
3. Click **Load sample file → broken-panel-schedule.csv**, then **Validate and import**. This is a minimized "customer file": 7 rows copied from a legacy PDF. Read the summary — `2 imported, 5 rejected, 1 warning` — then the rejected-rows table: a missing name, the `xfmr` abbreviation, a missing location, the `criticl` typo (with a "did you mean" hint), and a duplicated row. Note that the padded ` PANEL ` row was salvaged by normalization and the US-format date imported *with a warning* instead of failing — errors and warnings are deliberately different things.
4. In **Support diagnostics**, read the suggested next actions, then click **Draft customer reply**. Try to copy it — you can't until you check *"I reviewed this draft"*. That checkbox is the AI guardrail, and it has its own Playwright regression test.
5. Click **Generate report**: the critical switchgear you just imported is highlighted. (Open the archived *Elm Street Manufacturing* facility to see that archived facilities refuse to generate customer-facing reports.)
6. The whole loop is documented: this exact broken file is the customer ticket in [docs/support-reproduction.md](docs/support-reproduction.md), the handoff in [docs/bug-report-example.md](docs/bug-report-example.md), and pinned regression tests in both suites.

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

No backend, no API keys, no configuration — data persists to localStorage, and **Reset demo data** (top right) restores the seed. Pushing to GitHub auto-publishes a live demo via `.github/workflows/deploy.yml` (enable **Settings → Pages → Source: GitHub Actions** once).

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

## What this demonstrates (QA + Support Engineer)

- **QA ownership from day one** — acceptance criteria and a risk map came before the tests; [docs/traceability.md](docs/traceability.md) proves coverage was built systematically, and honestly lists the gaps.
- **Support engineering instincts** — row-level diagnostics with plain-language reasons, suggested next actions, and a reviewed customer reply. The support→fixture→regression loop is walked end-to-end in [docs/support-reproduction.md](docs/support-reproduction.md).
- **Regression thinking** — a customer's broken file became a committed fixture whose exact outcome (7 rows → 2 imported, 5 rejected, 1 warning) is pinned by both unit and e2e tests. It can never drift silently.
- **Deterministic automation** — pure parser, injected clock, committed fixtures, role-based locators, zero sleeps. 26 unit + 14 e2e tests, all green in CI.
- **AI with guardrails, practiced not preached** — the app's AI-assisted reply drafter is gated behind human review (and that gate is itself regression-tested); the repo was built AI-assisted under the same rules it documents.
- **Clear communication** — bug report, release checklist, and support docs written for the people who actually read them: engineers, support, and customers.

## What I would add next

- Import preview step (validate → review → commit) so customers can fix rows before anything imports.
- Downloadable "rejected rows" CSV so customers can fix and re-import only failures.
- Real LLM behind the reply drafter (BYO key), keeping the identical review gate.
- Playwright visual snapshots for report rendering; axe-core accessibility checks in CI.
- Contract tests on the exported JSON report schema.
