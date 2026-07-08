# RUN session — run the batches sequentially (cold start)

This session may be a different one from planning. Start cold: read the main workflow's
`.hyper/workflows/<workflow-name>/RUNBOOK.md`, derive state from VCS, and run. You need nothing from the PLAN session except its files.

The batches run **one after another**: one workflow at a time, each verified and landed before the
next. The **driver loop** (this session) is the "main workflow"; each batch is a sub-workflow it
launches. Two ways to drive — pick per the user's intent:

- **Attended** — drive it yourself and watch `/workflows`. Best when the user wants to see each batch
  and approve landings.
- **Unattended** — wrap the loop in `/loop` so it survives sleeps/restarts and lands on its own. Best
  for walk-away runs (needs the permission allowlist from PLAN Step 6).

Both run the **same one-iteration algorithm**. It is idempotent: it re-derives state from VCS each
time, so a restart — or a brand-new session — resumes cleanly (the plan and progress live in
files/VCS, so nothing depends on session continuity).

## One iteration

```
1. SYNC + DETECT STATE
   - update the working copy (e.g. git switch main && git pull)
   - in_flight = the one batch whose landing is open but not merged (if any)
   - next      = the first RUNBOOK batch whose items are NOT yet landed

2. IF in_flight EXISTS  → shepherd it, do NOT start a new batch:
   - checks green + landable → land it (e.g. gh pr merge --merge --delete-branch); reschedule soon
   - checks pending         → reschedule (sleep ~270s; CI is minutes); re-check next firing
   - checks FAILED          → STOP. Alert the user with the failing detail. Do not retry blindly.

3. ELSE IF next EXISTS  → build it (the spec + workflow are ALREADY authored by PLAN — see below):
   a. open a landing branch
   b. driver pre-edits shared/scaffolding files (new registry/category/index entry)
   c. run the batch workflow:  Workflow({ scriptPath: '.hyper/workflows/<workflow-name>/NN-<batch>/workflow.js' })  → await
      Read only the workflow's COMPACT return (counts, per-item verdict/blockers, allSkillGaps, file
      manifest) — do NOT read full per-agent prose into the driver; drill into /workflows for detail.
   d. DRIVER VERIFY (authoritative — never skip): run the project's VERIFY commands (type-check + lint
      + tests, with the batch filter + standing guards). The driver RUNS the gates (cheap — just the
      pass/fail tail). If red, hand the failures to a fix sub-agent (it reads the files + source, edits,
      reports what it changed); the driver re-runs the gate. Bounded (~2 rounds). Don't read source
      files into the driver to fix them yourself.
   e. driver post-edits shared files the batch requires (e.g. register new risky items in a test map)
   f. IF the workflow's allSkillGaps is non-empty → patch the ITEM recipe NOW (pilot-first), before landing
   g. stage only the new + driver-owned files; commit (project's message rules); push; open the landing (PR)
   h. reschedule soon — the next firing shepherds this landing to merge (step 2)

4. ELSE (no in_flight, no next)  → DONE.
   The RUNBOOK checklist is complete. Stop. Report the summary + anything deferred. Invent no new work.
```

**Specs are authored in PLAN, not here.** If `next`'s `spec.md`/`workflow.js` are missing (a stub
slipped through) or a problem forces a re-spec, do NOT author in the driver's context — spawn a
**spec-author sub-agent** (give it the scope + exemplar/source paths + the current recipe; it writes
the pair and returns a digest), or stop and hand back to a PLAN pass. The driver stays lean.

## Watch it run (visibility)

- **`/workflows`** — live list of running/done workflows; select one for the progress view: each
  phase with agent counts, token totals, elapsed; drill into any agent to read its prompt, recent
  tool calls, and result. `p` pause/resume, `x` stop, `f` filter by status.
- **Task panel** — a one-line progress summary of the active workflow sits below the input box;
  arrow down + Enter to expand.
- **Driver log** — emit one status line per batch ("W<n>: built X/Y, blockers Z, gaps G; verify
  green; PR #") so the sequence is legible without opening the workflow view.

## Pacing (unattended)

Use `ScheduleWakeup` (dynamic `/loop`) to re-fire with the **same `/loop` prompt**. Waiting on CI →
sleep ~**270s** (stays in the prompt-cache window; CI is ~3–8 min). Just landed / need the next batch
→ short reschedule (~60s). Build + verify run inline; reschedule only to wait on external state.

## Stop, don't thrash

Halt the loop and alert the user on: failed CI on a driver-verified batch; an unfixable verify error
after ~2 rounds; a workflow returning blockers it could not fix; or **any decision the plan did not
lock** — including a fork discovered mid-run that PLAN never grilled (e.g. "this batch duplicates
existing behavior", "this scope is wider/narrower than planned", a new security trade-off). Surface it
with the evidence and let the user decide; do not resolve it autonomously to keep moving. **Never
loosen a guard or invent a scope decision to keep going.** The RUN session implements and stops — it
does not re-plan.

## Kickoff lines

Attended: `Run the hyper-workflows RUN for <project>: follow .hyper/workflows/<workflow-name>/RUNBOOK.md. Do the next batch and report.`

Unattended: `/loop Continue the hyper-workflows RUN for <project>: follow .hyper/workflows/<workflow-name>/RUNBOOK.md
(skill hyper-workflows, RUN session). Do one iteration, then reschedule until the RUNBOOK checklist is complete.`
