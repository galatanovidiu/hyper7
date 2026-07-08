---
name: hyper-workflows
description: Plan a large multi-batch implementation in one session, then run it in a separate session through dynamic workflows. Use when a build/migration/audit/rollout is too big for one pass and planning and execution should happen in different sessions — "plan a big build then run it later", "split work into workflow batches", "run the batches one after another", set up an autonomous or /loop-driven run, or orchestrate many subagents over a long task. The PLAN session scopes, grills every decision, splits into batches, and writes one dynamic-workflow script per batch. The RUN session (cold start) executes them sequentially, each verified and landed before the next, resuming from files + VCS.
---

# hyper-workflows — plan in one session, run in another

A reusable pattern for implementation work too big for one pass, split across **two sessions**:

- **PLAN session** → [references/planning.md](references/planning.md): scope the work, run `grilling`
  to lock every decision, split into sized **workflow batches** (`W<n>`), and write the RUNBOOK +
  each batch's spec + each batch's dynamic-workflow script. It **authors** the workflows; it never
  runs them.
- **RUN session** (cold start) → [references/running.md](references/running.md): read the RUNBOOK,
  derive what's done from VCS, run one batch's workflow at a time, verify + land each before the
  next, resume after any restart.

The two sessions share nothing but files. The PLAN session ends with zero open decisions and a
complete file set; the RUN session needs no memory of it.

## Dispatch — which session am I in?

1. Look for a RUNBOOK at `.hyper/workflows/<workflow-name>/RUNBOOK.md` (one per main workflow — glob
   `.hyper/workflows/*/RUNBOOK.md`). If several exist, the user names which to run.
2. **No RUNBOOK, or open decisions remain → PLAN session.** Plan and script everything
   (planning.md). Run no workflow.
3. **RUNBOOK exists and every batch is scripted → RUN session.** Run or resume (running.md). A
   `/loop`-wrapped run lands here each firing.

## Substrate: a driver loop launching one workflow per batch

The "main workflow" is the **RUN session's driver loop**, not a single `Workflow()` call. It runs
each batch as **its own dynamic workflow** (a `pipeline(specs, build, review→fixIfBlockers)` of
subagents), one at a time, and does the verify + land between them itself.

A single top-level workflow spanning all batches is the wrong fit, because the Workflow runtime:

- takes **no mid-run user input** — so no human gate between batches;
- **does not resume across a Claude Code restart** — a long run that gets interrupted starts fresh;
- has **no shell/git/filesystem** in the script itself — verify and land would have to be agent
  stages, off the main session.

The driver loop avoids all three: state lives in files + VCS, so a cold session — even a different
one from planning — resumes cleanly and lands each batch from the main session.

## Invariants (hold in every project)

- **Decide everything in the PLAN session.** A workflow takes no mid-run input; any unresolved
  decision stalls the RUN. Grilling drains that queue before any batch runs.
- **One batch = one workflow = one landing.** Run one at a time; never start the next batch's
  workflow until the current batch has landed.
- **The driver re-verifies every batch** with the project's own gates (lint/types/tests/CI). Never
  trust an agent's "pass" — a reviewer can miss what a real gate catches.
- **State lives in files + VCS.** Each RUN iteration re-derives "what's done," so the run is
  idempotent and resumes after a crash, sleep, or session switch.
- **Fix the recipe, not the output.** A batch that exposes a gap in the build instructions → patch
  the instructions before the next batch (pilot-first; W1 is the pilot).
- **Build agents touch only their own new files.** Shared/scaffolding files (a registry, an index, a
  category list, a test map) are edited by the **driver**, before/after the workflow — never by the
  parallel build agents (they would conflict).
- **Author in the PLAN session, not the RUN session.** PLAN writes every batch's spec + workflow
  (planning.md Step 4). The RUN session only runs, verifies, and lands — it does **not** author specs in
  its own (driver) context, and it does **not** carry unscripted "stub" batches. Leaving a batch as a
  scope stub defers the hardest research and the genuinely-hard decisions (W8's "this is a duplicate"
  fork) into the autonomous run, where there is no one to grill. If authoring genuinely must happen
  during a run (a stub slipped through, or a problem forces a re-spec), delegate it to a **spec-author
  sub-agent** — it reads the source/exemplars and writes `spec.md` + `workflow.js`, returning a short
  digest — never pull that reading into the driver.
- **Keep the driver's context lean — the driver orchestrates, sub-agents read.** Source-reading work
  (spec research, fix-red, deep "never trust pass" verification) goes to sub-agents that return digests;
  the driver ingests only verdicts, gate pass/fail, and file manifests. Reading source files into the
  driver is what fills the main context fastest, so a workflow returns a **compact** result (counts +
  per-item verdict/blockers + skill-gaps + file paths), not verbose per-agent prose.

## Layout

One directory per **main workflow** (a whole plan→run effort), holding its RUNBOOK and its ordered
batch subdirectories:

```
.hyper/workflows/
  W1-<workflow-name>/        # one directory per MAIN workflow (e.g. W1-core-abilities)
    RUNBOOK.md               # this workflow's single cold-start entry point
    01-<batch-name>/         # one directory per batch, ordered; 01 is the pilot
      spec.md                # per-item build specs the build agents read
      workflow.js            # this batch's dynamic-workflow script
    02-<batch-name>/ …
  W2-<workflow-name>/ …      # a separate, later effort gets its own main-workflow folder
```

Batch directories are **plain-named by topic** with a 2-digit order prefix (`01-widgets`,
`02-transients`) — never `W<n>-`. The `W<n>` names the *main workflow*, not the batch. `RUNBOOK.md` is
self-contained: a cold RUN session reads only it to start. It carries the **profile** (below), the
**locked decisions**, the **ordered batch checklist**, the per-iteration algorithm pointer
(→ running.md), the **kickoff line**, and the **DONE** condition. (A project that doesn't use `.hyper/`
may relocate the root; say so in the RUNBOOK.)

## The profile (lives in the RUNBOOK header — no separate file)

hyper-workflows is the mechanics; the RUNBOOK's profile header supplies the project specifics:

- **GOAL** — one line.
- **ITEM recipe** — how to build one unit + its test (a build-guide file the agents read).
- **Authoritative source** — what to verify runtime semantics against (don't let agents guess).
- **VERIFY** — the exact commands the driver runs that must pass (type-check + lint + tests + any
  standing guards), with the batch filter.
- **LAND** — how a batch ships: branch/commit/PR/merge, or just commit, or emit an artifact.
- **DONE** — the checklist whose completion ends the run.
- **Driver-owned files** — shared files the build agents must not touch; the driver edits them
  before/after each batch's workflow.
