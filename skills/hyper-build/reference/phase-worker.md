# Worker

This file is the authoritative instruction set for the **worker** dispatch when the implement phase dispatches a worker sub-agent.

Your authoritative instructions are this file. Resolve every sibling reference
it makes (`worker-guardrails.md`, `state-root.md`) relative
to THIS file's directory, not your current working directory.

Implement exactly one subtask.

Resolve the Hyper state root per `state-root.md` before
reading or writing `.hyper/` paths. Read
`worker-guardrails.md` before editing code.

## Inputs

- `task.md`
- `04-execution-plan.md`
- one `T<N>.<M>-<slug>.md` subtask file
- upstream artifacts referenced by the subtask

## Flow

1. Re-read the assigned subtask file.
2. If the subtask is a resumption (`status: in-progress` with
   `awaiting: user-input` or `awaiting: plan-conflict`) and `## Open
   questions` now carries a fresh answer from the orchestrator (or the
   plan conflict has been resolved upstream), clear the subtask's
   `awaiting` to `null` before continuing. This is the worker's own
   `awaiting` field on its subtask file — the worker is the only writer
   of subtask `status` and `awaiting` outside the `## Invalidated
   subtasks` reset path.
3. If the subtask is a fresh dispatch (`status: todo`), set its
   `status: in-progress`.
4. Work only inside the declared `writes` boundary.
5. Mid-work blockers — choose the channel by the kind of block:

   a. **Scope question** (need a file outside `writes`, need a tooling
      decision, need clarification on the subtask itself). Stop, add or update
      `## Open questions`, set `awaiting: user-input`, return to the
      orchestrator.

   b. **Plan conflict** (the technical-plan's assumption is broken; this
      subtask cannot succeed under the current plan, regardless of scope).
      Stop, add or update `## Plan conflict` with the sub-fields below, set
      `awaiting: plan-conflict`, return to the orchestrator.

      `## Plan conflict` sub-fields:

      - `revival_signal: <alternative name from 03-technical-plan §Alternatives considered, or `none`>`
      - **Broken assumption** — one sentence stating what the plan assumed.
      - **Evidence** — exact observation, file:line reference, or command output that contradicts the assumption.
      - **Recommendation** (optional) — what the worker thinks should happen.

6. Implement the slice.
7. Run the smallest meaningful tests or checks for the slice.
8. Write `## Completion` with file-grouped notes and check results.
9. Set `status: done` and `awaiting: null`.

## Rules

- Do not change sibling subtask files.
- Do not widen `writes`; block and ask instead.
- For `role: test`, write tests and record a red baseline.
- For `role: impl`, confirm the sibling test baseline now passes without
  editing the test files.
- Use `awaiting: user-input` for scope or clarification blocks. Use
  `awaiting: plan-conflict` when the technical-plan's assumption is broken.
  When uncertain, ask: "would a different file or a quick user answer unblock
  me?" If yes, it is a scope question. If no, and the plan itself needs to
  change, it is a plan conflict.
- When raising a plan conflict, prefer naming a `revival_signal` from
  `03-technical-plan.md` §Alternatives considered. `revival_signal: none` is
  valid when the conflict was not anticipated by any documented alternative.
- Do not work around a broken plan assumption silently. The plan-conflict
  channel exists so the design phase can revise; bypassing it loses the
  design escalation signal.
- When a durable learning surfaces, record it in `.hyper/memory/`
  per the contract in `memory.md`, writing the entry
  inline rather than invoking the `hyper-memory` skill.

## Return contract

A worker never returns a phase-level verdict to `hyper-build`; it mutates exactly
one subtask file and exits. The implement phase reads the subtask's final state
and rolls it up into the phase verdict per its own return contract.

The subtask file's terminal state on a worker exit is one of:

- `status: done`, `awaiting: null` — slice implemented; `## Completion`
  written with file-grouped notes and check results
- `status: in-progress`, `awaiting: user-input` — scope question; `## Open
  questions` updated; needs a user answer before the worker can resume
- `status: in-progress`, `awaiting: plan-conflict` — the technical plan's
  assumption is broken; `## Plan conflict` written with the four sub-fields
  in §"Mid-work blockers"
