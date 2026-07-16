---
id: L<N>
title: <title>
status: active
# Legal values: active | done. Paused/blocked loops stay `active`; the last cycle's `Next: pause` is the only paused marker.
created: <YYYY-MM-DDTHH:MM:SS>
updated: <YYYY-MM-DDTHH:MM:SS>
---

# L<N> — <title>

<!-- `TBD` is the only placeholder. A section is filled when no `TBD` and no `<...>` prompt remains in it. -->

## Goal
TBD

Why: TBD

## Constraints
- TBD

## Non-negotiables
- TBD

## Definition of done
- TBD

## Understanding
<!-- Restate the ask; what already exists in the codebase; what is missing or unclear. -->
TBD

## Authority
Mode: interactive
<!-- interactive | delegated -->
Delegated authority: none
<!-- none | <standing authority the user granted, including boundaries> -->
Decision proxies: none
<!-- none | <skills or agent roles that may decide inside delegated authority> -->
Stop for user:
- goal, why, definition of done, or non-negotiables would change
- destructive action, credential/security/privacy/legal risk, external side effect, or material cost
- public contract or user-facing behavior would change outside the approved goal
- close without verify, unresolved proxy disagreement, or missing required proxy

## Loop plan
Pressure-tested: no
<!-- no | <YYYY-MM-DDTHH:MM:SS> | skipped — trivial plan -->
Approved: no
<!-- no | user <YYYY-MM-DDTHH:MM:SS> | proxy <YYYY-MM-DDTHH:MM:SS>. Rework or reframe resets to `no`. -->

- Approach: TBD
- Parts and order: TBD
- Key decisions: TBD
- Open risks: TBD

## Route
TBD
<!-- One-line current route hypothesis. On reroute: overwrite here, log a `route:` entry with the reason in Decisions. -->

## Parts
<!-- 2–5 parts when the work decomposes naturally; else the single P1 below. -->
<!-- Status lives in the heading: todo | current | done. Exactly one part is `current` from creation to close; queued parts start `todo`, `Pressure-tested: no`, `Approved: no`. -->
<!-- Part numbers are append-only: next = max(existing P<N>) + 1. Work on a part requires status `current` AND `Approved: user|proxy <ts>`. -->

### P1 — Whole goal — current
Pressure-tested: no
<!-- no | <YYYY-MM-DDTHH:MM:SS> | covered by loop plan — a part needs its own test when it adds a new dependency, data shape, or user-visible surface; otherwise the loop-level test may cover it. -->
Approved: no
- Goal: TBD
- Approach: TBD
- Dependencies and risks: TBD

## Decisions
<!-- Single append-only log for load-bearing choices, rulings, and route changes. -->
<!-- Entry shape: `- <YYYY-MM-DDTHH:MM:SS> — <entry>`. Prefix route changes with `route:` and include the reason. Replace this line with the first real entry. -->
_No decisions yet._

## Evidence digest
<!-- Living list: still-relevant findings promoted from cycles. -->
- TBD

## Relevant artifacts
<!-- Evidence files saved in the loop folder (logs, diffs, screenshots), linked here. -->
- TBD

## Starting point
<!-- One-time snapshot at creation: repo state, starting commit (`git rev-parse HEAD`), prior loop reference if continuing one. -->
TBD

## Cycles

<!--
Append entries as `### Cycle N — <YYYY-MM-DDTHH:MM:SS> — <short title>`. N = max + 1; entries are never rewritten. Fields, exact order:

  **Intent:** probe | implement | validate | reroute | reframe | stop
  **Move:** <what was done and why it was the next useful thing — smallest meaningful move>
  **Evidence:** <exact result, verbatim where practical. For `implement`: diff range as file:line-line plus one of: passing test | command + output | screenshot/log>
  **Learning:** <what the evidence changed about the prior belief, the route, or the risks. `no change` is a valid finding>
  **Next:** continue | back up | split | pause | close | reframe

Intent meanings: probe = answer a question before commitment · implement = production change on an approved current part · validate = check work or route · reroute = same goal, new route (update ## Route + `route:` Decisions entry) · reframe = the goal changed (voids approvals; re-run Align) · stop = pause or close.
Next meanings: continue = another cycle on this route · back up = revise a plan or assumption · split = a new part block was written and awaits approval · pause = stop, loop stays active · close = enter Verify and Close · reframe = re-run Align first.
Pairings: Intent reframe → Next reframe. Intent stop → Next pause | close. There is no `Intent: split` — a split never bypasses part approval.
-->

_No cycles yet._

## Handoff cues
- Next atomic move: TBD
- Current risk or uncertainty: TBD
- Dirty or unvalidated state: none

## Verified outcomes

<!--
Append entries as `### Verify N — <YYYY-MM-DDTHH:MM:SS>`. N = max + 1; entries are never rewritten, even after remediation.

  **Tests:** <command → exit code, decisive excerpt> | n/a — no test suite | n/a — research-only loop
  **Code review:** <verdict: pass | needs-changes | blocked, plus top findings> | n/a — research-only loop
  **Docs:** <summary> | n/a — no user-facing surface change
  **Definition of done:** one line per DoD item — met | not met | n/a — <evidence already recorded in this file: file:line, test name, artifact, or log entry>
  **Result:** pass | partial | fail
-->

_No verify runs yet._

## Outcome
Close summary: TBD
Verify link: TBD
<!-- Verify N | n/a. When n/a (close without verify), add:
Close-without-verify reason: <reason>
Unfinished items: <what still matters>
-->
