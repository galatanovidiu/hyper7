---
name: hyper
description: >
  Runs the main Hyper workflow: adaptive loops for development work where the route must evolve through contact with reality, and the goal may need probing before it is ready to commit. Each loop persists so sessions can resume without losing context. Use when the user wants to build, fix, iterate, course-correct mid-flight, probe before committing, or break a goal into adaptive slices — it is the default entry point. For rigid, fully-specified work that should run through fixed phases (intake → spec → technical-plan → execution-plan → implement → verify → docs), use the hyper-build skill instead. Keywords: hyper, iterate, loop, ooda, adaptive, probe, course correct, build, fix, feature.
argument-hint: "[L<N>|new|<title>|.hyper/loops/... ]"
---

# Hyper

Run tracked adaptive work as OODA loops — observe, orient, decide, act — with state persisted so any session can resume where the last one stopped.

## When to Use

Reach for hyper when the path, or the goal itself, must stay flexible: probing before committing, prototyping, splitting a big goal into adaptive parts, or multi-session work whose context must survive interrupts. User signals: iterate / explore / probe / experiment / pivot / course-correct verbs, or hedged uncertainty about the path ("not sure yet", "depends on what we find").

## The Iron Law

NO CYCLE BEFORE APPROVAL. NO `done` WITHOUT VERIFY.

- A cycle runs only after the loop plan and the current part are approved (Align gate).
- `status: done` requires a passing verify entry — or the user explicitly closing without verify.
- Approval is an unambiguous literal yes to the plan just posted. Hedges ("sounds reasonable", "I guess") and silence are not approval — re-ask as a yes/no question. A materially edited plan needs fresh approval.

## The Process

Four phases, in order. The phase sections below are the authority.

1. **Load and Route** — probe state, resume or create a loop.
2. **Align** — interview, plan, pressure-test, approve.
3. **Cycle** — one evidence-backed move at a time, with zoom-out checkpoints.
4. **Verify and Close** — tests, code review, docs, definition-of-done walk.

Terms: a **loop** is the whole tracked unit of work; a **part** (`P<N>`) is one bounded scope inside it; a **cycle** is one OODA move inside a part.

## The Loop File

A loop lives at `.hyper/loops/L<N>-<slug>/loop.md` (structure: `templates/loop.md`), plus optional evidence files linked from `## Relevant artifacts`. Resolve paths from the probe's `state_root`; keep paths written into the file repo-relative.

Event log + materialized view: `## Decisions`, `## Cycles`, and `## Verified outcomes` are append-only — `Cycle N` and `Verify N` numbers allocated max + 1, `## Decisions` entries as timestamped bullets, none rewritten. Every other section is living state, overwritten as reality changes — except `## Starting point`, written once at creation and never edited. Every mutation refreshes frontmatter `updated`. Timestamps: UTC, `YYYY-MM-DDTHH:MM:SS`.

`TBD` is the only placeholder. Replace a section's `TBD` with its first real content; write `TBD` for anything genuinely unknown — never invent a different placeholder. If `## Cycles` grows unwieldy, move old entries to `cycles-archive.md` in the loop folder, leaving one-line stubs — archiving and interrupt repair are the only two exceptions to append-only.

## Phase 1 — Load and Route

Run the state probe once at session start:

    node "<skill-base-dir>/../hyper-build/scripts/state.mjs"

`<skill-base-dir>` is printed at skill load; the probe lives in the sibling `hyper-build` skill (all Hyper skills install side by side). Route every state decision — state root, active loops, next loop id — from its JSON output; do not re-scan folders or re-read frontmatter for routing. If the probe errors, surface it and stop — likely a broken install.

Read `.hyper/rules.md` (project rules — normative when present) and, when the probe reports `learnings.exists: true`, `.hyper/memory/index.md` (recall hints; open entries on demand). Re-read both on every resume; if a current rule conflicts with the loop's recorded plan or decisions, surface the conflict and log the ruling in `## Decisions`.

**Route** — pick the first that applies: resume by id or path → resume by clear title → resume the only active loop → ask (multiple candidates, target unclear) → create. One loop per session at a time; switching loops re-enters Phase 1. A loop whose last cycle ended `Next: pause` is paused but still `status: active`. Done loops are never reopened — continue from one by creating a new loop that references it in `## Starting point`.

**On create:**

1. Take `next_loop_id` from the probe; pick a short title and kebab-case slug; create `loop.md` from the template, filling frontmatter and the H1.
2. Write the one-time `## Starting point` snapshot, including the starting commit (`git rev-parse HEAD`).
3. Authority: `delegated` only on an explicit grant ("YOLO mode", "decide for me", or equivalent) — record scope and proxies in `## Authority` plus a `## Decisions` entry. Otherwise `interactive`.
4. Parts: 2–5 when the work decomposes naturally, else the single `P1 — Whole goal`. Exactly one part is `current`.
5. Announce the created loop id and title in one line.

**On resume**, read in layers: hot (always) — every section from `## Goal` through `## Route` (including `## Authority`), the current part block, `## Evidence digest`, `## Handoff cues`. Warm (when the next move needs more) — other part blocks, recent `## Decisions` entries, `## Starting point`, last 3 cycles, latest verify entry, `## Outcome`. Cold (on demand) — older cycles, archive, artifact files.

**Interrupt repair.** If the last cycle entry lacks `Next`, the session died mid-write. The one exception to append-only: complete that entry in place with what you know — prose fields may say `interrupted`; when the real next move is unknown, set `Next: back up`. Never start a new cycle over an incomplete one. If part statuses are inconsistent on resume (zero or two `current` parts), repair from the last cycle and `## Handoff cues`, and log the repair in `## Decisions`.

As work progresses, promote durable signal upward: load-bearing choices and route changes → `## Decisions`, still-relevant findings → `## Evidence digest`, restart-critical notes → `## Handoff cues`.

## Phase 2 — Align

An interview pass before any implementation:

1. Restate the request and scan the project (relevant files, recent commits, related loops) — write `## Understanding`.
2. Fill `## Goal` (including its `Why:` line), `## Constraints`, `## Non-negotiables`, and `## Definition of done` from what is known plus the clarifications gathered here.
3. Settle `## Loop plan` (approach, parts, key decisions, risks) and `## Route` with the user — or a decision proxy in delegated mode.

Ask one question per message, and only what changes the loop: goal, hard constraints, plan shape, first part boundary. Every ask that presents options marks exactly one `[RECOMMENDED — <reason citing concrete signal>]`; if no option is defensibly better, say so and let the user pick. This rule applies to every question and approval ask in this skill.

**Pressure test.** A plan is **non-trivial** when it spans multiple parts, adds an external dependency, changes a public contract, or makes a hard-to-reverse decision. Non-trivial plans require a pressure test before approval: invoke the pressure-test capability (see Capabilities), preferring a sub-agent to run the interview and return a digest; fold the answers into the plan and set `Pressure-tested: <ts>`. Trivial plans record `Pressure-tested: skipped — trivial plan`. Non-trivial plans also get an offer of cross-model review (`hyper-team`), outcome logged in `## Decisions` — the user may decline; in delegated mode invoke it without asking. If review changes the plan, re-run the pressure test.

**Post and ask.** Write the agreed plan into the file — including `## Route` and the first `## Handoff cues` next move — post a concise summary in chat (goal, approach, parts, key decisions, risks), then ask for approval per Authority — the ask names what it covers: the loop plan and the current part's plan together. On approval set `Approved: user <ts>` (or `proxy <ts>`). On rejection set `Approved: no`, log the reason in `## Decisions`, rework the disputed area, re-post, re-ask. Rework that materially changes the plan re-runs the pressure test (and the non-triviality check) before the re-ask. The plan only exists once the file is written and the summary has been seen.

**Gate.** Cycles start when: the alignment sections (`## Goal` through `## Route`) and the **current part block** contain no `TBD` and no unreplaced `<...>` prompt (HTML comments exempt; queued `todo` parts may keep `TBD` until promoted); `## Handoff cues` `Next atomic move` is filled; the loop plan's `Pressure-tested` is a timestamp or the recorded skip; the current part's `Pressure-tested` is resolved (a timestamp or `covered by loop plan`); and the loop plan and the current part both show `Approved: user|proxy <ts>`.

**Parts.** Each part block carries its own goal, approach, risks, and `Approved:` line. The Phase 2 approval ask covers the loop plan and the initial current part together (single-part loops: that is P1) — record the approval on both. A later part is aligned and approved when it becomes current, informed by what earlier parts taught. Dependencies between parts must form a DAG over `P<N>` ids — no circles; on a circle, ask the user which dependency to break before approving. A part needs its own pressure test only when it adds a new dependency, data shape, or user-visible surface; otherwise record `covered by loop plan`.

## Phase 3 — Cycle

One cycle = one coherent move, recorded per the entry shape in `templates/loop.md`. Run one at a time unless the user asks for a batch. A loop may close after a single cycle; there is no minimum.

1. Read or run just enough to see the next useful move.
2. Pick an Intent: `probe | implement | validate | reroute | reframe | stop`.
3. Make the smallest meaningful move — smallest meaningful, not smallest possible.
4. Capture Evidence exactly (large output → save as an artifact file, keep the decisive excerpt inline; do not paraphrase away the signal).
5. Record Learning — what the evidence changed. Refresh `## Route`, `## Handoff cues`, and part statuses as reality shifts.
6. Set Next: `continue | back up | split | pause | close | reframe`.

Intent rules:

- `implement` — production change on the approved current part. Dispatch to a sub-agent by default for multi-file or risky slices (see Delegation); the parent may edit directly for small bounded changes — the Evidence requirement holds either way.
- `reroute` — same goal, new route: overwrite `## Route` and log a `route:` entry in `## Decisions` with the reason for the change.
- `reframe` — the goal changed: update `## Goal`, set `Next: reframe`, and re-run Phase 2 before any further cycle. A reframe voids approvals — the loop plan and every non-`done` part reset to `Approved: no` and `Pressure-tested: no`; `done` parts stand unless the user explicitly reopens one (log it in `## Decisions`). Re-approval may be brief but is never inherited from the old goal.
- `stop` — pause (loop stays `active`; write `## Handoff cues` — `Next atomic move` is the move the *next* session should take, including prerequisites like branch or env, plus current risk and dirty state) or close via `Next: close`.

**Splits and part handover.** Opening a new part starts with the zoom-out checkpoint below — run it before writing anything; only if the chosen direction is still the split, end the cycle with `Next: split`, append a part block (`P<max+1>`, status `todo`, `Approved: no`), then align and approve it before any cycle runs on it. A `todo` part rejected before approval is deleted — log the removal in `## Decisions`; never reuse its number. It becomes `current` when the prior part finishes — or immediately if work is redirecting, in which case the displaced part goes back to `todo` (its `Approved:` line stands) or to `done` if its remaining scope moved into the new part; say which in the cycle's Learning. One new part per split cycle. When the current part's goal is met, flip it `done` and promote the next part in the same turn; if none remain, head to close. Exactly one part is `current` from creation until the loop closes — the final part flips `done` in the closing cycle. `done → current` reopening happens only via verify remediation or an explicit user decision, logged in `## Decisions`.

**Zoom-out checkpoints.** The pull to finish the next cycle is strongest exactly when the route is wrong. Stop and check when any trigger fires:

- three cycles completed in the current part since the last checkpoint;
- two consecutive cycles ended `back up`;
- a cycle's Learning forced a reroute that no checkpoint or user/proxy decision chose;
- the next move is a split;
- the user hints at a pivot ("what about…", "wait", "I'm not sure", naming a different goal in passing) — treat it as a reframe signal until proven otherwise; never absorb it silently as a plan tweak.

At a checkpoint, post (chat shape): where the loop is, what the part plan assumed (its block plus approval-time `## Decisions` entries), what the evidence has shown since, and three directions — continue, reroute, reframe. Ask per Authority; log the ruling in `## Decisions`. Checkpoints are not skippable — "the next cycle is almost done" is the failure mode, not a reason.

## Phase 4 — Verify and Close

Entered by the closing pair `Intent: stop` + `Next: close`, or by user-explicit abandonment at any point (→ close-without-verify branch). Paused and blocked loops stay `active` and do not enter Phase 4.

First detect research-only loops: diff against the starting commit in `## Starting point` — `git diff <commit>` **plus** `git status --porcelain` (untracked files are code changes too). No starting commit or no git repo → judge from the cycle log's `implement` cycles. Only a loop with no code changes anywhere is research-only: tests and code review record their `n/a` alternates and the review capability is skipped.

**Run four checks**, recorded as a `Verify N` entry (shape in `templates/loop.md`):

1. **Tests** — run the project's suite; capture command, exit code, decisive excerpt (full log → artifact).
2. **Code review** — invoke `hyper-code-review` on the loop's diff; record verdict and top findings.
3. **Docs** — if user-facing surface changed (CLI, UI, API, public functions, advertised behavior), invoke `hyper-docs`; else record `n/a — no user-facing surface change`.
4. **DoD walk** — every `## Definition of done` line: `met | not met | n/a`, each citing evidence already recorded in the loop (file:line, test name, artifact, or log entry). Evidence is cited, never invented at verify time.

**Result mapping** — `pass`: tests green or legal `n/a`, review `pass` or `n/a`, docs done or `n/a`, every DoD line `met | n/a`. `fail`: a failing test, a `blocked` review, or any DoD line `not met`. `partial`: everything else (e.g. review `needs-changes` with tests green). Set `Verify link: Verify N` in `## Outcome` on every run, pass or fail.

**Result: pass** → set `status: done`, write `Close summary` (result + material tradeoffs), post a closing chat summary.

**Result: partial | fail** → loop stays `active`. Rewrite `## Handoff cues` with the named failures as the next move. Run one or more remediation cycles against them — reopen a `done` part if that is where the failure lives, logging it, and flip it back to `done` when its remediation completes — then re-enter the verify gate and append a fresh `Verify N+1` entry. The re-review scopes to the remediation diff plus every unresolved finding from the failed entry; tests re-run in full. Do not edit `## Definition of done` to make a failure pass without explicit user approval.

**Close without verify** — user-explicit only ("drop it", "good enough", "abandon"): check `Dirty or unvalidated state`; if anything other than `none`, ask — commit, stash, discard, or leave for the next loop — and record the choice. Then set `status: done`, write a real `Close summary`, `Verify link: n/a`, and the close-without-verify lines from the template.

## Authority

`interactive` (default): the user answers goal-shaping choices, plan approvals, checkpoint directions, and close-without-verify.

`delegated`: active only on an explicit recorded grant — `Delegated authority` and `Decision proxies` carry concrete non-`none` values. It changes who answers routine gates — it removes no gate, evidence requirement, pressure test, or verify. Any user gate in this skill may then be answered by a decision proxy (per `Decision proxies`, typically `hyper-team`): send a brief — context, options, recommendation, constraints, evidence, the `Stop for user` list — and require exactly one verdict: `approve | needs rework | choose <option> | stop for user`, with rationale. Log verdicts in `## Decisions`; approvals record as `Approved: proxy <ts>`. Anything on the `Stop for user` list (in the template) always goes to the user, as does proxy disagreement or missing proxy support.

## Capabilities

| Role | When required | Skill |
|---|---|---|
| pressure-test | Align, non-trivial plan | `grilling` — or any installed skill that stress-tests a plan |
| code-review | Verify, code changed | `hyper-code-review` |
| docs | Verify, user-facing surface changed | `hyper-docs` |
| cross-model review / decision proxy | suggested; required for delegated-mode approvals | `hyper-team` |

A required capability that is missing is never silently skipped: offer install, substitute for this loop, or stop. Log substitutions in `## Decisions`.

## Delegation

Delegate bounded slices — clear input, output, and stop condition: recon, focused validation, adversarial review, pressure-test interviews, one part's implementation. Keep with the parent: phase transitions, all `loop.md` writes, gate state, user approvals in interactive mode, and anything needing the loop's accumulated context. One writer per code path.

Implement dispatch — give the child: the slice, a writes boundary (files it may touch), the Evidence requirement, and read-only context. Take back: a diff summary, Evidence, and any blocker — `scope question` (parent resolves, re-dispatches) or `route conflict` (next cycle is `reroute`, or `reframe` if the goal broke). Children return text; the parent writes the cycle entry. A child that returns nothing usable: record that as the Evidence, then tighten and redelegate, or take the move directly.

## Chat Output

At every meaningful moment — cycle report, approval ask, checkpoint, route shift, verify summary, close — open with:

```
**Done:** <one line — concrete action and outcome>
**Why:** <one line — how this advances the loop goal, not the cycle intent>
**Where we are:** <part + phase + status>
**Risk or surprise:** <one line, or `none`>
**Needs from you:** <decision | approval | info | nothing — continuing>
```

One line per field; state empties explicitly (`none`, `nothing — continuing`). Plain questions during the Align interview skip the block — one clear question beats boilerplate.

## Red Flags — STOP

| You're thinking | Reality |
|---|---|
| "Sounds good" means approved | Hedges are not approval → re-ask as yes/no. |
| The checkpoint can wait one cycle | That pull is the drift → run it now. |
| I'll fold the pivot in and keep going | Pivot = reframe signal → surface it; re-align if the goal moved. |
| I remember the evidence, I'll cite it at verify | Evidence must already be recorded → it is in the file or it does not count. |
| Editing the DoD makes verify pass | Scope changes need the user → ask first. |
| The user is wrong about that bug | Test the claim first: run it, show exactly what was run and observed, invite correction. A survived pressure test earns no immunity from fresh evidence. |
| Work is done, flip it to `done` | No `done` without a passing verify entry — or the user's explicit close. |

## Quick Reference

- Loop status: `active | done` — paused = last cycle `Next: pause`, still `active`.
- Part status (in the heading): `todo | current | done` — exactly one `current`; work needs `current` + approved.
- Intent: `probe | implement | validate | reroute | reframe | stop` · Next: `continue | back up | split | pause | close | reframe` · pairings: reframe → reframe, stop → pause | close.
- Approval: `Approved: no | user <ts> | proxy <ts>` — literal yes only; material edits reset it.
- Verify result: `pass | partial | fail` — entries append-only, remediation appends `Verify N+1`.
- Entry shapes and field-level legal values live in `templates/loop.md`; behavior lives here.
- Durable learnings: write inline to `.hyper/memory/` per the contract in `../hyper-memory/reference/memory.md`.
