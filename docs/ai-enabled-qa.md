# Building QA From the Ground Up in an AI-Enabled World

This is the operating model this repo demonstrates. The one-sentence version:

> Use AI for speed — coverage ideas, data variation, summaries, first drafts. Keep acceptance criteria, deterministic regression tests, committed fixtures, and human release judgment as the source of truth.

## My QA Operating Model

1. Start with product risks and real customer workflows, not tooling.
2. Define acceptance criteria with product/engineering **before** writing tests.
3. Use AI to brainstorm edge cases, malformed data, and test skeletons.
4. Review the suggestions; convert the useful ones into **committed, versioned fixtures**.
5. Automate stable, high-risk workflows first (here: CSV import and the report).
6. Keep exploratory testing for ambiguous UX and field conditions.
7. Treat every support ticket as a regression-test input.
8. Gate releases on a short, honest checklist — risk and evidence, not vibes.

## Where AI Accelerates QA

| QA area | How AI helps | Human guardrail |
|---|---|---|
| Story review | Flags vague acceptance criteria, suggests missing edge cases | QA owner confirms expected behavior with product |
| Test design | Drafts exploratory charters and boundary cases | QA owner cuts irrelevant or unsafe cases |
| Test data | Generates CSV variations: malformed rows, duplicates, casing, whitespace, locale dates | Only reviewed fixtures are committed; nothing is generated at test time |
| Automation | Drafts Playwright/Vitest skeletons | Engineer owns selectors, assertions, and expected outcomes |
| Debugging | Summarizes import errors, logs, reproduction notes | Human confirms root cause before filing |
| Support | Drafts customer replies and bug reports | Reviewed for accuracy and tone before sending — enforced in this app's UI |
| Regression planning | Suggests coverage gaps after a bug | QA owner decides what becomes permanent coverage |

## Where AI Must Not Be Trusted Blindly

- **Defining expected behavior.** A model will confidently invent a spec. Expected behavior comes from product decisions, written down as acceptance criteria.
- **Self-approving its own tests.** An AI-drafted test that asserts what the code *does* (instead of what it *should do*) launders bugs into "coverage."
- **Nondeterminism in the loop.** Live-generated test data or LLM-judged assertions make failures unreproducible. Everything that gates a release must replay byte-for-byte.
- **Customer contact.** Drafts are fine; unsent review is the rule. This demo makes the rule mechanical: the reply's copy button is disabled until a human checks "I reviewed this draft," and `import.spec.ts` has a regression test proving the gate works.
- **Release calls.** "All tests pass" is an input. Whether the release ships is a human risk judgment.

## Example: Turning a Customer Import Issue Into Regression Coverage

The full walkthrough is in [support-reproduction.md](support-reproduction.md); the shape:

1. Customer reports rows missing after importing a legacy panel schedule.
2. Reproduce with their file; minimize it to `broken-panel-schedule.csv` (7 rows covering seven distinct failure modes) and commit it.
3. AI-assisted step: summarize the failed rows, draft the bug report and the customer reply.
4. Human step: verify each row's expected outcome against the acceptance criteria, correct the draft, send.
5. Lock behavior in: unit test asserts the fixture's exact error list (row, field); e2e test asserts the on-screen diagnostics. The fixture's outcome — 7 rows → 2 imported, 5 rejected, 1 warning — can now never drift silently.

## Example: Using AI to Expand CSV Edge Cases

Prompt an assistant with the parser's contract and ask "what customer file breaks this?" Keep what's plausible for field data, discard the noise, and commit the keepers:

- Kept → fixtures/tests: `xfmr` (legacy abbreviation), `criticl` (hand-entry typo), `05/10/2024` (US date), duplicated pasted row, padded ` PANEL ` cells, unquoted comma shifting columns, header in different casing.
- Discarded: multi-GB inputs (out of product scope for paste), binary blobs, injection strings already neutralized by the parser design — noted in a charter instead of automated.

The AI produced the *candidates* in minutes; the value judgment about what a real electrical contractor's spreadsheet looks like stayed human.

## Human Review and Release-Risk Guardrails

- Acceptance criteria precede automation; tests cite the story they protect ([traceability.md](traceability.md)).
- Fixtures are code-reviewed files, not runtime generation.
- A test that flakes is quarantined and fixed or deleted — flaky coverage is negative coverage.
- The [release checklist](release-checklist.md) includes explicit AI-hygiene checks.
- Accountability doesn't delegate: AI speeds up my work; the quality call is mine.

## What I Would Build First as the First QA Hire

Week 1–2: risk map with founders/support; acceptance criteria for the top three customer workflows; a smoke-level e2e suite on the riskiest one (almost always data import/export).
Week 3–4: deterministic fixture library from real (anonymized) customer files; CI gate; bug/support templates so tickets arrive reproducible.
Then: the support→fixture→regression loop as a standing process, AI-assisted at every step where it saves time — with the guardrails above.
