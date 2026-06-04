# Execution-plan phase

This file is the authoritative instruction set for the **execution-plan** phase when hyper-build routes to it.

You are in the **execution-plan** phase. Turn the approved technical shape into
worker-safe implementation slices.

Resolve the Hyper state root per `reference/state-root.md` before
reading or writing `.hyper/` paths. The data model is in
`reference/data-model.md`. The gate contract is in
`reference/gates.md`.

## Inputs

- `task.md`
- `01-intake.md`
- `02-spec.md` for non-bugfix feature tasks
- `03-technical-plan.md`
- Any existing `04-execution-plan.md`
- Any existing `05-execution-plan-review.md`
- Existing subtask files, if this phase is being revised

## Outputs

- `04-execution-plan.md`
- `T<N>.<M>-<slug>.md` subtask files
- `05-execution-plan-review.md`
- A verdict to `hyper`

## Flow

1. If an existing `04-execution-plan.md` has an approved
   `05-execution-plan-review.md` and the user approved the execution plan,
   return `phase-complete`.
2. If the user requested changes to the execution plan, revise
   `04-execution-plan.md` and the affected subtask files.
3. Re-read `03-technical-plan.md` and the upstream artifact that defines the
   accepted outcome.
4. Produce `04-execution-plan.md` from `templates/04-execution-plan.md`.
5. Create one subtask file per worker slice from `templates/subtask.md`.
6. Ensure every subtask has explicit `depends`, `writes`, `awaiting`, and
   `role` fields.
7. Read `reference/phase-execution-plan-review.md` and follow it as the
   authoritative instructions for the execution-plan review pass; apply the
   verdict it returns.
8. If review is `pass`, return `awaiting-approval`.
9. If review is `needs-changes`, fix the plan and subtask files, re-run review,
   then return `awaiting-approval`.
10. If review is `blocked`, return `awaiting-input` or redirect to the earlier
    phase named by the review.

## Slicing rules

- `writes` is the authoritative ownership boundary for workers.
- Test and implementation siblings may use `role: test` and `role: impl` with
  disjoint `writes`.
- A subtask must be buildable by another agent reading only `task.md`,
  `04-execution-plan.md`, its own subtask file, and the referenced upstream
  artifacts.
- Keep `04-execution-plan.md` tool-neutral. Do not name a specific harness or
  sub-agent API in the plan.
- When a load-bearing slicing or ownership choice is settled (parallel
  vs serial decomposition, test/impl pairing strategy, conflict-driven
  re-slicing), append a `## Decisions` entry to `dashboard.md` per
  `reference/dashboard.md` §Decisions log contract, authoring
  as `execution-plan`.

## Return contract

- `awaiting-input` — unresolved execution-shaping question remains
- `awaiting-approval` — `04-execution-plan.md`, subtask files, and
  `05-execution-plan-review.md` are ready for approval
- `phase-complete` — approved execution plan is ready for implementation
- `redirect target: spec` — the execution plan exposed a spec problem
- `redirect target: technical-plan` — the execution plan exposed a technical
  design problem
