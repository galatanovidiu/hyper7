# Implement phase

This file is the authoritative instruction set for the **implement** phase when hyper-build routes to it.

You are in the **implement** phase. Execute only the approved plan.

Resolve the Hyper state root per `reference/state-root.md` before
reading or writing `.hyper/` paths. The data model is in
`reference/data-model.md`. Worker guardrails are in
`reference/worker-guardrails.md`.

## Inputs

- `task.md`
- `03-technical-plan.md`
- `04-execution-plan.md` and subtask files for `scope: feature`
- `checks.md` when verify redirected back to implementation

## Flow

1. Re-read `task.md`. On re-entry from `redirect target: technical-plan`
   (detect: prior `plan-conflict.md` was present and the technical-plan
   revision approved in this re-entry has been read), perform the subtask
   reset described in `## Re-entry behavior` before continuing.
2. If `checks.md` exists with a blocking or needs-changes result and this is a
   remediation dispatch, implement only the remediation described there.
3. For `scope: quick`, implement directly from `03-technical-plan.md`, run the
   relevant checks, summarize the work, and return `phase-complete`.
4. For `scope: feature`, read `04-execution-plan.md` and all subtask files.
5. If this dispatch is a re-entry on a user reply (the previous return was
   `awaiting-input` and `task.md` `awaiting` was just cleared by `hyper`),
   route the reply to the subtask that produced the open question:
   record the answer under the subtask's `## Open questions` per
   `reference/gates.md` §Question serialization, then re-dispatch
   a worker sub-agent (per step 7) against that subtask. The worker clears
   its own `awaiting` on resumption per its own Flow. Continue to step 6 only
   after this routing completes.
6. Dispatch every ready `status: todo` subtask whose dependencies are done.
   Use parallel workers only when their `writes` sets are disjoint.
7. Dispatch each worker as a sub-agent and give it a packet:

   a. the ABSOLUTE path to `reference/phase-worker.md` as its authoritative
      instruction set;
   b. the absolute path to the assigned subtask file — exactly one subtask
      file per worker as its authoritative slice;
   c. the rule: "your authoritative instructions are phase-worker.md; resolve
      every sibling reference it makes (worker-guardrails.md, state-root.md)
      relative to phase-worker.md's own directory, not your current working
      directory";
   d. the worker's silent-exit return contract: the worker mutates exactly one
      subtask file and exits; it never announces completion to the user.
8. Scan ready and in-progress subtasks for `awaiting: plan-conflict`. If any
   are found:

   a. Read each conflicted subtask's `## Plan conflict` section.
   b. Write `plan-conflict.md` at the task folder root, aggregating every
      conflict under `## Conflicts` with one entry per subtask
      (`raised_by: <subtask-id>`).
   c. Choose `## Recommended re-slicing` (`none` | `partial` | `full`) based
      on whether the conflicts touch the slicing assumptions in
      `04-execution-plan.md`. Default to `partial` when uncertain.
   d. Return `redirect target: technical-plan`.

   Plan-conflict rollup takes precedence over `awaiting-input` propagation in
   the same dispatch. If both signals are present, the orchestrator rolls up
   plan conflicts first; the user-input subtasks remain blocked and will
   resume after the technical-plan revision.

9. If any subtask blocks on user input (and no plan conflict was rolled up
   above), return `awaiting-input`.
10. When all subtasks are `done`, return `phase-complete`.

## Rules

- When a load-bearing orchestration choice is settled at any scope
  (a conflict-driven re-slicing recommendation, a worker-blocker
  escalation that changes the slicing assumptions, a remediation that
  expands scope beyond `checks.md` findings, a quick-scope opt-out
  from a documented `checks.md` remediation), append a `## Decisions`
  entry to `dashboard.md` per `reference/dashboard.md`
  §Decisions log contract, authoring as `implement`.
- When a durable learning surfaces, record it in
  `.hyper/memory/` per the contract in
  `reference/memory.md`, writing the entry inline rather
  than invoking the `hyper-memory` skill.

## Feature orchestration rules

- Do not edit implementation files yourself for feature-scope work unless you
  are performing a verify remediation that is too small to dispatch safely.
- Treat `writes` as a hard ownership boundary.
- Do not dispatch a subtask until all ids in `depends` are `done`.
- Do not re-dispatch a `done` subtask.
- If a completed early subtask changes a shared API or parameter name, scan
  remaining subtask files for downstream drift before dispatching the next
  dependent slice.

## Re-entry behavior

When the task re-enters `implement` after a `redirect target: technical-plan`
cycle:

1. Read the revised `03-technical-plan.md`. It must contain an `##
   Invalidated subtasks` section listing subtask ids whose prior `done` state
   was invalidated by the revision.
2. For each id in `## Invalidated subtasks`:
   - reset the subtask file's `status` to `todo`
   - clear its `awaiting` (set to `null`)
   - leave the subtask's `## Completion` text in place (it documents what was
     done; future workers may reference it during re-implementation)
3. Delete the task-folder `plan-conflict.md`. The redirect is closed; the
   revised technical plan is the new source of truth.
4. Resume normal dispatch.

This is the only path through which the implement phase writes to subtask
files' `status` or `awaiting` fields.

## Return contract

- `awaiting-input` — at least one subtask is blocked on a user answer
- `redirect target: technical-plan` — at least one subtask raised a plan
  conflict, or the orchestrator detected one; `plan-conflict.md` has been
  written
- `phase-complete` — implementation or remediation is complete and ready for
  verify
