# FieldAsset QA Lab — agent guide

Frontend-only React 19 + TypeScript + Vite demo of an AI-enabled QA workflow. No backend; state persists to localStorage under key `fieldasset-qa-lab/v1`.

## Commands

- `npm run dev` — dev server on 5173
- `npm run build` — typecheck (`tsc --noEmit`) + production build
- `npm run test:unit` — Vitest (`tests/unit/`)
- `npm run test:e2e` — Playwright (`tests/e2e/`, starts its own dev server)

## Architecture

- `src/domain/` — pure, deterministic logic only (CSV parsing/validation, report building, support-reply drafting). No React, no I/O, no `Date.now()` inside functions — time is injected. This is the most heavily unit-tested code; keep it pure.
- `src/app/store.tsx` — React context store; all mutations append `AssetHistoryEvent`s.
- `src/test-fixtures/*.csv` — committed fixtures, imported with `?raw` by both the UI sample buttons and the tests. **Never regenerate these casually**: `broken-panel-schedule.csv` has an exact expected outcome (7 rows → 2 imported, 5 rejected, 1 warning) pinned by unit and e2e tests.

## Rules for changes

- Behavior changes to the import parser require updating `docs/traceability.md` and the affected acceptance criteria — expected behavior is defined there, not by whatever the code currently does.
- New customer-visible failure modes need: a fixture, a unit test, an e2e assertion, and plain-language error copy (readable by a non-technical office manager).
- Playwright locators: roles/labels first; `data-testid` only for dynamic regions. No sleeps.
- Tests must stay deterministic — no network, no random data, no clock reads in assertions.
- All demo data is fictional; never add real company, customer, or facility names.
