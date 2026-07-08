# Hyper — Autonomous Run Engine

This file is the authority for `Run: auto`: how a loop drives its own cycles
without a per-cycle prompt from the user, and what stops it. It governs Phase 3
only. The Phase 1/2 alignment gate and the Phase 4 verify gate are unchanged and
still apply in full.

The principle: in `Run: auto` the agent stops being the turn-driver. After each
cycle a **separate evaluator** decides whether to keep going, and the loop keeps
going on its own until the bar is met or a stop boundary fires. Approval safety
is preserved — the stop-for-user boundary below is non-negotiable in every mode.

## The two axes

`## Authority` carries two independent fields:

- `Mode: interactive | delegated` — *who answers gates.* Unchanged from the base
  skill.
- `Run: manual | auto` — *who drives turns.*

| `Run` | `Mode` | Behavior |
|-------|--------|----------|
| `manual` | either | One cycle, then yield to the user. The user drives each turn. This is the default and matches base Hyper. |
| `auto` | `interactive` | The loop drives its own cycles. It breaks to the user at a zoom-out checkpoint or any stop-for-user trigger. |
| `auto` | `delegated` | The loop drives its own cycles. A decision proxy resolves checkpoints; the loop breaks to the user **only** at a stop-for-user trigger. |

`Run` defaults to `manual`. Set `Run: auto` only when the user explicitly asks
for autonomy: "auto", "run it", "keep going until done", "don't stop to ask me
each cycle", or the standing-autonomy grant that also sets `Mode: delegated`.
Record the grant in `## Decisions`.

## The machine-checkable bar — the gate for auto

`Run: auto` requires a stop condition a fresh reader can prove from the
transcript. This is the one hard precondition the engine adds.

- Every line under `## Definition of done` carries a `— check: <predicate>`
  whose result lands in the loop's output: a command and its exit (`npm test
  exits 0`), a count (`grep -rc "TODO(auth)" src == 0`), an observation (`GET
  /health → 200`), or a file/state fact (`dist/app.js exists`).
- `## Current bar` carries a `Check:` line: the machine-evaluable condition for
  the loop's current state.

**Auto-run refusal.** If any `Definition of done` line has no `check:`, or
`## Current bar` `Check:` is not machine-evaluable, do not set `Run: auto`. Say
which line is not checkable, offer to make it checkable or to run `manual`, and
stay `manual`. A vague bar is the signal that the loop is not ready to run
itself — surfacing that is the point, not a failure.

## The `bar-check` capability

The evaluator is a **separate** agent from the one doing the work — the doer
never grades its own homework. Resolve it from the capability registry
(`bar-check`, required when `Run: auto`). Preferred: a cheap sub-agent
(Haiku-class). It may be backed by the native `/goal` evaluator for the plain
done-check, but the four-way verdict below is owned by Hyper.

After each Phase 3 cycle in `Run: auto`, give the evaluator a brief:

- the bar: `## Current bar` `Check:` plus the `## Definition of done` checks and
  their current pass/fail/unknown state from the cycle's evidence
- the latest cycle's `Evidence`, `Learning`, and `Route impact`
- the `## Authority` `Stop for user` triggers, verbatim
- the governance counters (below)

The evaluator returns exactly one verdict, plus a one-line reason:

| Verdict | Meaning | Engine writes |
|---------|---------|---------------|
| `continue` | Progress made, bar not yet met. | next cycle, `Next: continue` |
| `done` | Every bar check passes. | close handoff: `Intent: stop` + `Next: close` → Phase 4 |
| `course-correct` | A checkpoint, route change, or stall a proxy resolved (`delegated` only). | `Next: continue` after the route shift; append `## Route shifts`; reset drift counters |
| `stop-for-user` | A boundary or checkpoint fired; a human must decide (continue / reroute / reframe). | `Next: pause`, surface in chat, await the user |

The evaluator applies this precedence — first match wins:

1. any `Stop for user` trigger fired → `stop-for-user`
2. unrecoverable error → `stop-for-user`
3. the goal itself is wrong → `stop-for-user` (a goal change is always the
   user's call; never auto-reframe a goal)
4. every bar check passes → `done`
5. a forced checkpoint fired — a route change (`Route impact` ≠ `no change`),
   two consecutive back-ups, or three cycles since the last checkpoint →
   `stop-for-user` in `interactive` (surface continue / reroute / reframe), or
   `course-correct` resolved by a proxy in `delegated`
6. stalled (`noProgressStreak >= 3`) → `stop-for-user` in `interactive`,
   `course-correct (reroute)` in `delegated`
7. progress made → `continue`
8. otherwise → `continue`

On `done`, record the cycle that met the bar as normal, then append the closing
handoff cycle (`Intent: stop` + `Next: close`); Phase 4 starts from that pair,
exactly as a manual close. Do not retro-edit the bar-met cycle's `Next`.

A route change never silently reroutes in `interactive` — it surfaces as a
checkpoint and the user picks the direction. `course-correct` verdicts arise only
in `delegated` mode (a proxy resolved a checkpoint, route change, or stall) and
always reset the drift counters. Reframe (a goal change) is never a direct
evaluator verdict: it is reached only when the user or a delegated proxy chooses
to reframe after a `stop-for-user` break. The evaluator never auto-changes a goal.

## Governance counters

The engine tracks these across cycles and passes them to the evaluator:

- `cyclesSinceCheckpoint` — cycles run since the last zoom-out checkpoint.
  Reset to 0 when a checkpoint resolves.
- `consecutiveBackups` — cycles that ended `Next: back up` in a row. Reset on
  any other `Next`. **A no-progress cycle is not a back-up** — only an actual
  `Next: back up` increments this.
- `noProgressStreak` — cycles in a row that moved no bar check toward pass.
  Reset to 0 on any progress.
- `lastRouteImpact` — the last cycle's `Route impact`.

## Zoom-out checkpoints

The base-skill checkpoints (Phase 3) still fire in `Run: auto`. A checkpoint is
a forced break: the engine may not silently continue past it.

A checkpoint fires when any holds: `cyclesSinceCheckpoint >= 3`,
`lastRouteImpact != no change`, or `consecutiveBackups >= 2`.

- `interactive`: the evaluator returns `stop-for-user`; surface the three
  directions (continue / reroute / reframe) and await the user, exactly as base
  Phase 3 specifies. Reset the counters on resume.
- `delegated`: a decision proxy resolves the checkpoint under the recorded
  authority; record the verdict in `## Decisions`, reset the counters, continue.

## The stop-for-user boundary

These are the same triggers already in `## Authority` `Stop for user`. In
`Run: auto` they are the hard edge of autonomy and break the loop in **every**
mode, delegated included:

- the goal, why, definition of done, or non-negotiables would change
- a destructive action, credential/security/privacy/legal risk, external side
  effect, or material cost appears
- public contract or user-facing behavior would change outside the approved goal
- an external dependency not in the approved loop plan would be added
- close-without-verify is requested, or required proxy support is missing

When the loop breaks here, write the current cycle `Next: pause`, post the
chat block with `Needs from you:` naming the trigger, and stop. The user's reply
resumes the loop.

## Chat behavior in `Run: auto`

Suppress per-cycle chat. The per-cycle record goes to `loop.md`
(`## Cycles`), not to the user. Post a chat message only at:

- a `stop-for-user` break (decision needed)
- an `interactive` zoom-out checkpoint (direction needed)
- `done` → the Phase 4 verify summary and close summary

This is the "I don't prompt each cycle anymore" behavior: the loop runs, the
file records every cycle, and the user hears from it only when a decision is
genuinely theirs.

## Stop conditions — the whole list

In `Run: auto`, the loop stops cycling only when one of these holds:

1. the bar is met → Phase 4 verify
2. a stop-for-user trigger fired → break and await the user
3. an `interactive` zoom-out checkpoint fired → break and await the user
4. an unrecoverable error → break and await the user

Everything else continues. Phase 4 (verify gate) and the alignment gate are
unchanged: `Run: auto` never closes a loop without a passing verify entry unless
the user explicitly closes without verify.

## Cross-session

A loop in `Run: auto` is still persisted in `loop.md` exactly as a manual loop.
To keep it driving unattended across turns or sessions, the next turn can be
re-entered by the host's scheduling (a self-paced wakeup, `/loop`, or a routine);
`loop.md` is the durable memory that survives the gap. The engine logic above is
identical whether the next cycle starts in the same turn or after a wakeup.
