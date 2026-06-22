---
name: hyper-medium
description: >
  A middle-weight Hyper workflow for adaptive development that must survive across sessions. Runs persisted observe-orient-decide-act loops with one alignment gate and one verify gate, but without parts, authority proxies, or dispatch machinery — a single track of cycles per loop. Each loop is saved under .hyper/loops/ so work resumes without losing context. Use when the path should stay flexible and the work spans more than one session, but does not need multi-part decomposition. Escalate to hyper when the goal must split into approved parts or run under delegated authority; drop to hyper-light for a quick single-session task; use hyper-build for rigid, fully-specified phase work. Keywords: hyper, medium, loop, adaptive, ooda, persist, resume, iterate, build, fix.
argument-hint: "[L<N>|new|<title>|.hyper/loops/... ]"
---

# Hyper Medium

Run tracked adaptive work as a single track of cycles: observe, orient, decide, act, repeat. Persist every loop so sessions resume. One alignment gate before implementing, one verify gate before closing.

For a quick single-session task with no saved state, use `hyper-light`. To split a goal into separately-approved parts or run under delegated authority, use `hyper`. For rigid, fully-specified phase work, use `hyper-build`.

The workflow is four phases in order: Load and Route → Align → Cycle → Verify and Close.

## The loop artifact

Each loop is a folder `.hyper/loops/L<N>-<slug>/` containing `loop.md` (canonical state; structure in `templates/loop.md`) and optional evidence files referenced from `## Relevant artifacts` (kebab-case: `cycle3-build-log.txt`).

- Overwrite living sections as reality changes; append to logs (`## Bar history`, `## Route shifts`, `## Decisions`, `## Cycles`, `## Verified outcomes`) — never rewrite them.
- Set `created` and `updated` at creation; refresh `updated` on every later mutation.
- Replace any `- None yet.` / `Not yet.` / `Not filled yet.` sentinel with the first real entry.
- Timestamps are `YYYY-MM-DDTHH:MM:SS`. Keep paths in `loop.md` repo-relative.
- When `## Cycles` exceeds 50 entries, move all but the most recent 30 to `cycles-archive.md`, leaving a one-line stub per moved cycle.

## Phase 1 — Load and Route

Call the state probe once at session start:

    node "<skill-base-dir>/scripts/state.mjs"

`<skill-base-dir>` is the path printed at skill load as "Base directory for this skill". Parse the JSON; route from its fields (`state_root`, `active_loops`, `next_loop_id`). Do not re-scan folders. Create `.hyper/loops/` under `state_root` if missing. Get the current UTC timestamp.

Read `.hyper/rules.md` if it exists and treat it as normative for the session. When the probe reports `learnings.exists: true`, read `.hyper/memory/index.md` as recall hints and open entry files on demand. Re-read both on every resume; if either now conflicts with a recorded decision, surface it and record the new ruling in `## Decisions` before continuing.

**Route.** Pick one: resume by id/path; resume by title; resume the only active loop; ask when several are active and the target is unclear; otherwise create. A session works one loop at a time. A loop whose last cycle is `Next: pause` is paused but still `active`. Done loops are never reopened — create a new loop and reference the old one in `## Starting point`.

**On create:**

1. Use `next_loop_id`. Pick a short title and kebab-case slug.
2. Create `loop.md` from the template; fill `id`, `title`, `status`, `created`, `updated`, replace the H1, and write the one-time `## Starting point` snapshot.
3. Write the initial bar into `## Current bar` (default: "clear alignment by approving the loop plan") and as the first `## Bar history` entry with its timestamp.
4. If the user grants standing autonomy ("YOLO", "decide for me", "no approval interruptions"), record the grant and its scope in `## Decisions`; this lets you self-approve gates that stay inside the recorded goal, constraints, and definition of done. It never removes the verify gate, evidence, or the stop-for-user triggers in Operating rules.
5. Announce: `Created L<N> — <title>. Starting adaptive loop.`

**On resume:** read `loop.md` in layers, not whole. Hot (always): the alignment surface, `## Evidence digest`, `## Handoff cues`. Warm (when the next move needs it): `## Starting point`, the logs, `## Relevant artifacts`, the last 3 cycles, the latest verify entry, `## Outcome`. Cold (on demand): older cycles, archive, raw artifacts.

**Mid-cycle interrupt recovery.** If the last `## Cycles` entry is missing fields after `Action`, the prior session died mid-cycle — complete that entry in place (the one exception to append-only). If the work itself did not finish, set `Evidence: Interrupted before evidence captured`, `Learning: none — interrupted`, `Route impact: no change`, `Next: back up`. Never start a new cycle over an incomplete one.

## Phase 2 — Align

Alignment is an interview pass before any implementation. Walk in order:

1. Restate the request (from the user, or a linked issue) into `## Task understanding`.
2. Scan the project — relevant files, recent commits, README, related loops. Often the missing piece is already on disk.
3. Record what exists and what looks missing into `## Existing code and findings`.
4. Fill `## Why`, `## Constraints`, `## Non-negotiables`, `## Definition of done`.
5. Settle the loop plan with the user and write it into `## Loop plan`.

Ask one question per message. Prefer multiple-choice when a structured-question tool is available. When a question has two or more variants, mark exactly one `[RECOMMENDED — <one-line reason>]` citing concrete signal (a file, a constraint, an observed risk); if none is defensibly better, say so and let the user pick. Only ask what changes the loop: goal, destination, hard constraints, non-negotiables, loop-plan shape. Skip what the loop will discover later.

**Probe before committing.** When alignment cannot be settled from reading alone, run one or more `Intent: probe` cycles first. Each names one approval-blocking question and one exit condition. Read-only by default. If a probe must write code, it writes only to a disposable scratch location (a `scratch/` dir in the loop folder, or a throwaway branch) — never the production tree, recorded in `Handoff cues` `Dirty or unvalidated state`. A probe never lands production code: anything worth keeping is re-written through a normal approved `implement` cycle, and scratch is deleted before close. Fold findings into `## Task understanding`, `## Existing code and findings`, and the loop plan.

**Pressure-test (optional but offered).** Before approval, offer to stress-test the loop plan against its decision tree — directly, or via a `grill-me`-style skill if installed. Fold answers into `## Loop plan` and `## Decisions`, set `Pressure-tested at`. For a non-trivial plan (more than a local change, a new dependency, a public-contract change, or a hard-to-reverse decision), also offer an external-model review and set `External review` to `completed`, `skipped`, or `n/a`. These are offers, not blockers.

**Post and approve:**

1. Write the agreed loop plan into `## Loop plan` (`Status: awaiting approval`).
2. Write `## Current route` from the route hypothesis and `Handoff cues` `Next atomic move` from the first post-approval move.
3. Post a concise plan summary in chat: goal and destination, approach, key decisions, open risks.
4. Seek approval, stating the recommended action as `[RECOMMENDED — <reason>]`. Under standing autonomy you may self-approve when the plan stays inside the recorded goal and a stop-for-user trigger does not apply.
5. On approval only: set `Status: approved`, `Approval source: user | standing autonomy`, `Approved at: <timestamp>`.

**What counts as approval.** A literal, unambiguous affirmative directed at the plan just posted (`approve`, `yes`, `go ahead`, `lgtm`, `ship it`). Hedging (`looks fine`, `I guess`, `sounds reasonable`) and silence are not approval — ask again as a yes/no. Approval expires if the plan is materially edited afterward; re-ask. Record a bare approval only in the approval fields, not in `## Decisions`.

**Alignment gate.** No `implement`, `validate`, or `reroute` cycle starts until the alignment surface (Goal, Why, Constraints, Non-negotiables, Definition of done, Task understanding, Existing code and findings, Loop plan, Current route, Current bar, Handoff cues `Next atomic move`) carries no placeholder sentinels and no unresolved `<...>` prompts, and the loop plan shows `Status: approved` with a real `Approval source` and `Approved at`. Only `Intent: probe` cycles may run earlier.

**On `needs rework`:** set `Status: needs rework`, reset `Approval source` and `Approved at` to `Not yet.`, re-settle the disputed area, record the reason in `## Decisions`, re-post, and only return to `approved` after fresh approval.

## Phase 3 — Cycle

Implementation cycles start only after the loop plan is approved. One cycle = one coherent move. Run one at a time unless the user asks for a batch. A loop may close after a single cycle. Allocate the next cycle number as max existing + 1; numbers are append-only. Use the cycle shape in `templates/loop.md` — exact field order, nothing omitted.

For each cycle:

1. Read or run only enough to see the next useful move; record what matters now and what you expected.
2. Choose one `Intent`: `probe | implement | validate | reroute | reframe | stop`.
   - `implement` requires the loop plan approved. State the files/paths you will touch in `Action`.
   - `reroute` — same goal, new route: also update `## Current route` and append to `## Route shifts`.
   - `reframe` — goal changed: update `## Goal` and `## Why`, set `Next: reframe`, reset the loop plan to `needs rework` (and `Pressure-tested at: Not yet.`, since the prior test was against the old goal), and re-run the Phase 2 gate before any further cycle.
   - `stop` — pause, block, or close. Closing uses `Intent: stop` + `Next: close`.
3. Take the smallest meaningful move that advances the intent — meaningful, not minimal.
4. Capture the exact result. Save large output to the loop folder, keep the decisive excerpt, link it from `## Relevant artifacts`. For `implement` cycles, Evidence is the diff range plus a passing test, a manual command + output, or a screenshot/log.
5. Record what the evidence changed, then check whether the goal is still right. If unclear, ask the user (under autonomy, decide unless a stop-for-user trigger applies). If the answer is no, the next intent is `reframe`.
6. Update `Handoff cues` `Next atomic move` every cycle. Set `Next`: `continue | back up | validate | pause | close | reframe`.
7. On the first real cycle, replace `_No cycles yet._`; append the entry and refresh `updated`. If the bar or route changed, also append to `## Bar history` or `## Route shifts`; record load-bearing choices in `## Decisions`.

**Drift check.** A loop drifts even when each cycle looks productive. Stop and surface the bigger picture when any fires: three cycles since the last checkpoint, a cycle with `Route impact` ≠ `no change`, two consecutive `Next: back up`, or a user message that hints at a pivot (hedging, "what about", "wait", or naming a different goal). Post where the loop is, what was believed vs what evidence now shows, and three directions (continue, reroute, reframe); ask the user (or decide under autonomy), then record the answer in `## Decisions` before resuming. When the user pivots mid-loop, treat it as a goal-reframe signal until proven otherwise — do not silently absorb it.

## Phase 4 — Verify and Close

Phase 4 starts when Phase 3 ends `Intent: stop` + `Next: close`, or when the user abandons the loop before any implement cycle. A paused or blocked loop stays `active` and does not enter Phase 4. The loop cannot flip to `status: done` without a passing `## Verified outcomes` entry, unless the user explicitly closes without verify.

Before any close, confirm `Handoff cues` `Dirty or unvalidated state` reports no leftover probe scratch; if any remains, delete it (or confirm it was already re-written through an approved `implement` cycle).

Run `git diff` against the loop's starting state. If there are no code changes, the loop is research-only: skip code review and mark Tests accordingly. **Run all four checks:**

1. **Tests** — re-run the suite; capture command, exit code, decisive excerpt. Alternates: `n/a — no test suite in project` or `n/a — research-only loop, no code changes`.
2. **Code review** — review the full diff per `reference/change-review.md`; record verdict and top findings, or `n/a — research-only loop, no code changes`.
3. **Docs** — if a user-facing surface changed, update docs per `reference/docs.md`; else `n/a — no user-facing surface change`.
4. **Definition of done** — walk every line; record `met | not met | n/a` backed by evidence already in `loop.md` (`file:line`, `test:`, `artifact:`, a decision or digest excerpt). Do not invent evidence inline.

Record a `Verify N` entry (append-only, never rewritten) with `Result: pass | partial | fail` and `Follow-up`. Set `Verify link` in `## Outcome`.

- **On `pass`:** set `status: done`, write `Close summary` with result and tradeoffs, post a short closing summary, stop.
- **On `partial`/`fail`:** stay `active`, return to Phase 3, run a remediation cycle fixing the named failures, then re-enter the gate (new `Verify N+1`). Do not edit `## Definition of done` to make a failure disappear without explicit user approval.
- **On close without verify** (user drops it): resolve any dirty state with the user (probe scratch may only be deleted or already-promoted, never committed), set `status: done`, write a real `Close summary`, `Verify link: n/a`, and add `Close-without-verify reason:` and `Unfinished items:`.

## Chat output shape

Every chat reply during a loop opens with this block; tool output goes beneath it.

```
**Done:** <one line — concrete action and outcome>
**Why:** <one line — how this advances the loop's goal, not just the cycle's intent>
**Where we are:** <phase + status: running | paused | awaiting approval | blocked | done>
**Risk or surprise:** <one line, or `none`>
**Needs from you:** <decision | approval | info | nothing — continuing>
```

One line per field; never omit a line (`none` / `nothing — continuing` when empty). Only `Needs from you` may be `nothing — continuing`. The bare creation announcement (Phase 1) is the only exception.

## Operating rules

- Append-only logs are never rewritten (except the one mid-cycle interrupt recovery). Living sections are overwritten in place.
- When a transition touches two sections, complete both writes in the same turn — the file must never cross a session boundary half-flipped.
- **User-claim verification.** When the user says something is broken, wrong, or missing, test it before disagreeing — run the command, read the file, inspect the state. Report the exact command, the files read with line ranges, what you observed, then ask whether the test you ran matches what they meant. Never dismiss a user claim without showing the test work. This overrides any prior pressure-test anchoring.
- **Stop for the user** instead of deciding under autonomy when: the goal, why, definition of done, or non-negotiables would change; a destructive action, security/privacy/legal risk, external side effect, or material cost appears; or public/user-facing behavior would change outside the approved goal.
- No `status: done` without a passing verify entry, unless the user explicitly closes without verify.
- When a durable learning surfaces, record it in `.hyper/memory/` per `reference/memory.md`, writing the entry inline.
- Legal values here mirror `templates/loop.md`; if either changes, update the other.
