<!-- GENERATED FILE — do not edit here. Source: shared/reference/gates.md. Regenerate: node scripts/sync-shared.mjs -->

# Hyper — Gate Protocol and Verdict Contract

This file is the single authority for how `hyper-build` and the phases
coordinate.

## Source of truth

- `task.md` `awaiting` is the top-level gate state.
- For blocked feature subtasks, the subtask file's `awaiting` is the more
  specific source of truth.
- A gate is open whenever `awaiting != null`.

## Ownership split

- `hyper-build` owns every mutation of `task.md` `phase:` and `awaiting:`.
- `hyper-task` owns user-initiated `phase: deferred` and `phase: cancelled`.
- The phases own their artifacts and the phase-specific classification fields
  on `task.md` (`scope`, `bugfix`). They do not write `phase` or `awaiting`.
- The worker owns subtask files' `status` and `awaiting`.
- The implement phase may write subtask files' `status` and `awaiting` *only*
  when resetting subtasks named in the revised technical plan's `##
  Invalidated subtasks` section, after a conflict-triggered re-entry.
  Otherwise the worker-owns-its-own-fields rule above holds.

## Verdict vocabulary

Every phase dispatch ends with exactly one verdict:

| Verdict | Meaning | `hyper-build` does |
|---------|---------|--------------|
| `awaiting-approval` | Artifact written; user approval required. | Set `task.md` `awaiting: user-approval` and stop. |
| `awaiting-input` | Open question(s) remain, or a user-choice prompt is required. | Set `task.md` `awaiting: user-input` and stop. |
| `phase-complete` | Phase is done and ready to advance. | Clear `awaiting`, apply the transition table, and re-enter dispatch when the next phase is non-terminal. |
| `redirect target: <phase>` | Non-linear transition. | Clear stale `awaiting`, set `phase: <target>`, and re-enter dispatch. |

## Phase transition table

`hyper-build` applies this table when a phase returns `phase-complete`:

| From phase | Scope / classifier | Next phase |
|------------|--------------------|------------|
| `intake` | `feature`, `bugfix: false` | `spec` |
| `intake` | `feature`, `bugfix: true` | `technical-plan` |
| `intake` | `quick` | `technical-plan` |
| `intake` | `research` | `research` |
| `spec` | `feature` | `technical-plan` |
| `technical-plan` | `feature` | `execution-plan` |
| `technical-plan` | `quick` | `implement` |
| `execution-plan` | `feature` | `implement` |
| `research` | `research` | `done` |
| `implement` | any | `verify` |
| `verify` | `quick` | `done` |
| `verify` | `feature` | `docs` |
| `docs` | `feature` | `done` |

After a phase-complete transition, immediately re-enter dispatch for the next
phase unless the next phase is terminal. The next phase owns any real
approval or input gate. Do not ask for a bare "continue" when the transition
is mechanically determined.

For `redirect`:

| From phase | Verdict | `hyper-build` sets |
|------------|---------|--------------|
| `execution-plan` | `redirect target: spec` | `phase: spec`, `awaiting: null` |
| `execution-plan` | `redirect target: technical-plan` | `phase: technical-plan`, `awaiting: null` |
| `implement` | `redirect target: technical-plan` | `phase: technical-plan`, `awaiting: null` |
| `technical-plan` | `redirect target: implement` | `phase: implement`, `awaiting: null` |
| `verify` | `redirect target: implement` | `phase: implement`, `awaiting: null` |

## What counts as a reply

When a gate is open, treat these as substantive replies:

- approval: `yes`, `approve`, `looks good`, `continue`
- direct answer to a question
- change request on the open artifact
- follow-up question about the current gated task

## Behavior when a gate is open

### `hyper-build`

- If exactly one active task has an open gate and the new user message is a
  substantive reply, clear `task.md` `awaiting` and re-enter the current
  phase.
- If the message is not a substantive reply, surface the gate label and stop.
- If multiple active tasks have open gates and the user did not name the task,
  ask which task the reply belongs to.

### The phases

- Record the user's answer or change in the artifact.
- Do not write `phase:` or `awaiting:` on `task.md`.
- Return `awaiting-input`, `awaiting-approval`, `phase-complete`, or
  `redirect target: <phase>` as appropriate.

## Question serialization

When the open gate is `user-input`:

- Ask one question per message.
- When the question has two or more variants, mark exactly one as
  `[RECOMMENDED — <one-line reason>]`. The reason cites concrete signal (file,
  finding, prior decision, constraint from the spec). If no variant is
  defensibly better, say so and ask the user to pick — do not invent a reason.
- Record the answer in the artifact under the question.
- If more unanswered questions remain, return `awaiting-input` again.
- Once all are answered, rename `Open questions` to `Resolved questions` or
  delete the section if redundant.

## User-facing gate messages

When a gate opens, the final user-facing message must be actionable. Include:

- task id, current phase, and `awaiting` label
- the artifact to review or the one question to answer
- exact replies that resume the workflow
- what Hyper does next after each accepted reply

Do not finish with only status, file links, or a gate label.

## Approval gates

Approval-gated phases are:

- `intake`
- `spec`
- `technical-plan`
- `execution-plan`
- `research`

Their contract is:

- write the approval artifact
- return `awaiting-approval`
- on approval, re-dispatch and return `phase-complete`

When asking for approval, state the recommended action and a one-line reason
in the form `[RECOMMENDED — <reason>]`. The reason cites concrete signal from
the artifact (a tradeoff resolved, a constraint honored, a risk dropped). If
the artifact presents alternatives, mark exactly one of them recommended by
the same rule in "Question serialization" above.

For approval gates, name both approval paths: approval accepts the artifact and
continues by the transition table; a change request re-dispatches the same
phase to revise the artifact.

## Remediation redirects

For blocked verify results:

- the verify phase writes `checks.md` and returns `redirect target: implement`
- `hyper-build` sets `phase: implement` and `awaiting: null`
- `checks.md` is the remediation source for the immediate next implement
  dispatch

For blocked implement results from plan conflicts:

- the implement phase writes `plan-conflict.md` and returns `redirect target: technical-plan`
- `hyper-build` sets `phase: technical-plan` and `awaiting: null`
- `plan-conflict.md` is the remediation source for the immediate next
  technical-plan dispatch

## Subtask-level awaiting propagation

- the implement phase detects blocked subtasks and returns `awaiting-input`
- `hyper-build` sets `task.md` `awaiting: user-input`
- on the user's reply, `hyper-build` re-enters the implement phase
- the implement phase records the user's answer in the subtask's `## Open
  questions` and re-dispatches the worker
- the worker clears its own `awaiting` on resumption per its Flow step 2;
  the implement phase does not write subtask `awaiting` outside the
  `## Invalidated subtasks` reset path (see ownership split above)

For plan-conflict subtasks:

- the implement phase detects subtasks with `awaiting: plan-conflict`, rolls
  them up into `plan-conflict.md`, and returns `redirect target:
  technical-plan`
- `hyper-build` sets `task.md` `phase: technical-plan` and `awaiting: null`
- `hyper-build` re-enters the technical-plan phase immediately; that phase reads
  `plan-conflict.md` before revising the plan

## Never do this

- The phases never write `task.md` `phase:` or `awaiting:`
- `hyper-build` never clears a gate without a substantive user reply
- Do not batch multiple open questions into one message
- Do not maintain hidden gate state outside the files
- Do not chain phases directly; transitions always go through `hyper-build`
