# RUNBOOK — <project> hyper-workflows run

The RUN session reads this file (and nothing from the planning session) to start. See the
`hyper-workflows` skill's running.md for the per-iteration algorithm. This RUNBOOK and its batch
subdirectories live under one main-workflow folder: `.hyper/workflows/<workflow-name>/`.

## Profile

- **GOAL:** <one line>
- **ITEM recipe:** <path to the build-guide the agents read> (+ checklist if separate)
- **Authoritative source:** <what to verify runtime semantics against>
- **VERIFY (driver runs, must pass):** <type-check + lint + tests + standing guards, with the batch filter>
- **LAND:** <branch/commit/PR/merge | commit-only | emit artifact>; <one landing open at a time?>
- **DONE:** <the batch checklist below is complete>
- **Driver-owned files (build agents must NOT touch):** <registry / category list / shared test map / …>

## Locked decisions (from grilling — the run blocks on nothing else)

- <decision 1>
- <decision 2>
- <deferred clusters, if any, and why>

## Batches (ordered; done-state derived from VCS)

- [ ] **01-<batch>** (PILOT) — <items> — dir `.hyper/workflows/<workflow-name>/01-<batch>/` — VERIFY filter `<…>`
- [ ] **02-<batch>** — <items> — dir `.hyper/workflows/<workflow-name>/02-<batch>/` — VERIFY filter `<…>`
- [ ] …

## Run it

- Attended: `Run the hyper-workflows RUN for <project>: follow .hyper/workflows/<workflow-name>/RUNBOOK.md. Do the next batch and report.`
- Unattended: `/loop Continue the hyper-workflows RUN for <project>: follow .hyper/workflows/<workflow-name>/RUNBOOK.md (skill hyper-workflows, RUN session). Do one iteration, then reschedule until the checklist is complete.`

## Invariants

- One batch = one workflow = one landing; run one at a time; land before the next.
- Driver re-verifies every batch with the project's gates; never trust an agent's "pass".
- State lives in files + VCS; each iteration re-derives what's done.
- Fix the recipe, not the output (pilot-first; the first batch is the pilot).
- Build agents touch only their own new files; the driver owns shared files.
- Specs were authored in PLAN; the RUN session does not author in its own context (delegate to a
  spec-author sub-agent if it must). Keep the driver lean — sub-agents read, the driver orchestrates.
- A fork the plan did not lock (duplicate work, changed scope, a new trade-off) → STOP and surface it;
  the RUN implements, it does not re-plan.
