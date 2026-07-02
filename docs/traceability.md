# Traceability: Stories → Risks → Tests

Coverage is built systematically, not by adding tests where they're easy. Each user story maps to the risk it carries, the manual check that explores it, and the automated test (by exact name) that locks it in.

| User story | Risk if broken | Manual check | Automated test |
|---|---|---|---|
| View the facility list on load | Team can't reach any records | Load app cold, verify seeded facilities and archived de-emphasis | e2e: `loads the facility list with seeded facilities` |
| Create a facility | Onboarding blocked; bad records with no name/customer | Submit empty and partial forms, read the messages | e2e: `creates a facility and displays it in the facility list`, `requires facility name and customer name with clear messages` |
| Add an asset manually | Field findings can't be recorded | Add asset with/without required fields; try a duplicate name | e2e: `adds an electrical asset to a facility` |
| Edit asset status | A technician's critical finding silently disappears | Change status, hard-refresh, verify | e2e: `edits asset status and persists it across a reload` |
| Import a valid CSV | Customer cannot onboard existing data | Paste `valid-assets.csv`, reconcile counts | e2e: `imports valid CSV rows and displays the imported assets`; unit: `accepts every row of the valid fixture` |
| Import a broken CSV | Silent data loss; support can't explain failures | Paste `broken-panel-schedule.csv`, review every reason | e2e: `shows row-level diagnostics for a broken CSV import`; unit: `produces the expected diagnostics for the broken customer-like fixture` |
| Messy-but-salvageable data imports | Good data rejected over whitespace/casing | Paste padded, mixed-case rows | e2e: `normalizes whitespace and asset type casing during import`; unit: `normalizes casing and trims whitespace on accepted rows` |
| Duplicates are blocked | Double-counted equipment destroys trust in reports | Re-import an existing asset name | e2e: `rejects duplicate asset names within the same facility`; unit: in-file + vs-existing duplicate tests |
| Malformed file structure fails clearly | Confusing partial imports | Paste headerless/short-header text | e2e: `rejects a file with a missing required header column`; unit: header/empty-input tests |
| Generate a facility report | Critical equipment missed by the customer | Reconcile report counts against the table | e2e: `generates a report that highlights critical assets`, `report reflects newly imported assets`; unit: `report.test.ts` |
| Archived facilities stay out of reports | Stale data reaches customers | Open an archived facility, look for report actions | e2e: `archived facilities are excluded from customer-facing reports` |
| AI-drafted replies require human review | Unreviewed AI text reaches a customer | Draft a reply, verify copy is locked until reviewed | e2e: `AI-assisted support draft requires human review before it can be copied` |

Gaps I know about (tracked, not hidden): file-upload import (only paste is implemented), large-file performance, and clipboard/download content verification in e2e — see "What I would add next" in the README.
