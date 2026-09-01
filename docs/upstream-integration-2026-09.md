# Upstream integration — September 2026

How dev came to include upstream's Hyper restructuring, what was decided, and
what was deliberately left alone.

Branch: `integrate-upstream` · Base: `dev` @ `68bd9e1` · Merged in:
`hyper-restructuring` @ `a2cf104` (an exact mirror of `galatanovidiu/hyper7`
main) · Replaces PR #23.

**Status: validation green.** `node scripts/validate-hyper.mjs` exits 0 and all
7 test suites (78 tests) pass. Neither branch was green before this work.

## Backups

Taken before anything was touched. `dev` itself was never checked out for
writing.

| Ref | Points at | Where |
|---|---|---|
| `backup-dev-2026-09-01` (branch) | `68bd9e1` | local + pushed to the fork |
| `backup/dev-2026-09-01` (tag) | `68bd9e1` | local + pushed to the fork |

Anything from old dev is recoverable, e.g.
`git show backup-dev-2026-09-01:skills/hyper/SKILL.md`.

## Why PR #23 could not just be merged

Upstream made two changes that interact badly:

- `301ea97` swapped the entry points — the phased router `hyper` → `hyper-build`,
  and the adaptive loop skill `hyper-iterate` → `hyper` (now the default).
- `5c83fec` then rewrote both from scratch ("half the ceremony").

Because the router was renamed **and** rewritten in the same change, git saw no
rename for `SKILL.md`. It detected the moves for `reference/*.md` but not for the
skill files themselves. So a plain merge produced:

- `skills/hyper-build/SKILL.md` — treated as a brand-new file. dev had no
  version, so it merged clean as upstream's, with **zero** of dev's Jira, YOLO,
  epic, help or sync integration. Verified: 0 hits for any of them.
- `skills/hyper/SKILL.md` — a modify/modify conflict that spliced dev's
  *task-router* prose into upstream's *OODA loop* skill. Half "run a loop", half
  "sync with Jira and archive the task".

Clearing the conflict markers would not have fixed that; the markers were in the
wrong file to begin with. Two further problems were invisible to git entirely
(issues 2 and 3 below).

## Direction chosen

**Base on upstream's tree and graft dev's features onto it** — not the reverse.

Upstream changed the engine: rewrote the core skills, added the state probe,
split memory out, migrated `hyper-task` and `hyper-backlog` onto the probe.
dev's work is mostly additive: two fully self-contained skills, one help skill,
and ~121 lines of router instructions. Starting from dev would have meant
reimplementing upstream's refactor by hand.

Done as a **real `git merge`**, not a file copy, so both parents are recorded.
The next upstream pull is an ordinary merge rather than another full
reconciliation. `7deb5cd` has parents `68bd9e1` (dev) and `a2cf104` (upstream).

**The rename was accepted** (`hyper` = adaptive default, `hyper-build` = phased).
It makes every step cheap. Reversing it later is a small mechanical commit —
rename two directories and their references — so this was not treated as a
blocking decision.

## Commits

### `7deb5cd` — Merge upstream restructuring into dev

Pure conflict resolution: 8 files, 19 hunks.

| File | Resolution |
|---|---|
| `skills/hyper/SKILL.md` | Upstream whole — this is the loop skill now. dev's router text saved for the graft. |
| `skills/hyper-task/SKILL.md` | Upstream's probe-based id allocation; dev's epic display and epic commands kept. |
| `scripts/validate-hyper.mjs` | Upstream whole, plus `hyper-jira`, `hyper-sync`, `hyper-help` → 15 registered skills. |
| `reference/data-model.md` | Union. Upstream's probe-owned id rules plus the `E<M>T<N>` naming fact; dev's `epic`, `jira_key`, `jira_synced_at`, `yolo` fields. |
| `reference/gates.md` | Union. dev's YOLO gate section under upstream's `## Remediation redirects` heading. |
| `reference/bootstrap.md` | Union, with `loops/` owned by `hyper`. |
| `README.md`, `AGENTS.md` | Rewritten by hand — both sides described the workflows in opposite terms. Also fixed an upstream omission: `hyper-digest` and `hyper-memory` were missing from the `AGENTS.md` user-facing list. |

Came through unconflicted: `hyper-jira`, `hyper-sync`, `hyper-help`, `schema.md`,
`docs/`, `package.json`, `scripts/deploy.sh`.

### `f14b430` — Complete the `hyper` → `hyper-build` rename

**Issue 1 (found here, not reported upstream).** The rename was incomplete
upstream. 44 references across 19 files still said `hyper` where they meant the
router — including every phase skill's return contract ("A verdict to `hyper`"),
`gates.md` ("`hyper` owns every mutation of `task.md` `phase:`", "transitions
always go through `hyper`"), and `worker-guardrails.md`. After the rename those
resolve to the *adaptive loop skill*. A phase skill following its own contract
would hand control to the wrong skill — a live routing bug, not a doc nit.

Swept by explicit `file:line` rather than global replace, because ~9 references
legitimately mean the loop skill and had to survive: the 15-skill list, the
`.hyper/loops/` owner, the loop approval gate, the probe-caller list,
`bootstrap.md`'s `loops/` owner, and `hyper-recipe` recommending the default
entry point.

Also fixed the 3 broken cross-skill paths the merge introduced: `hyper-jira` and
`hyper-sync` pointed at `../hyper/reference/state-root.md` and
`../hyper/templates/dashboard.md`, which moved to `../hyper-build/`. These were
the only *new* validator failures from the merge, and reading that run is how
they were caught.

### `a96cacc` — Graft dev's router features onto `hyper-build`

`skills/hyper-build/SKILL.md`: 221 → 338 lines. 8 of dev's 9 blocks:

1. Routing check 0 — help invocation → `hyper-help`
2. Jira resume sync in Cold-resume check
3. Create task 4a — `--epic E<N>` → `epic:` frontmatter + `E<N>T<M>-<slug>` folder
4. Create task 4b — leading `yolo` word → `yolo: true`
5. Create task 6 — `hyper-sync pull` tip
6. YOLO gate overrides — `hyper-team` as approval proxy, with two-strikes and
   no-consensus escalation
7. Jira archive steps — completion comment, status transition, optional
   auto-commit with the `:(exclude).hyper` pathspec
8. `hyper-sync push` tip on archive

**Not grafted, deliberately:**

- dev's manual task-id scan — superseded by the probe's `next_task_id`. The probe
  learns epic folders in the very next commit.
- dev's YOLO checkpoint suppression — **obsolete.** Upstream's rewrite deleted
  the `implement → verify` and `verify → docs` checkpoints outright; those
  transitions now advance in the same turn for every task, YOLO or not. There is
  no prompt left to suppress.

Contract follow-through in `gates.md`: dropped the two YOLO rows describing those
deleted checkpoints and three redirect bullets claiming `verify → implement`,
`implement → technical-plan` and `verify → docs` needs-changes stop for the user
— upstream's verdict mapping sets `awaiting: null` on all of them. Replaced with
a note saying there is no checkpoint to suppress, so the rows don't get re-added.

Added a note that `.hyper/jira.md`, `.hyper/repo.md` and `.hyper/epics.md`
activate by direct file existence, not probe output — so the new "route
everything from the probe" rule isn't read as forbidding those checks.

### `3f03cd1` — Teach the state probe about epic folders

**Issue 2 — the most dangerous, and invisible to git.** `state.mjs` matched task
folders with `/^T(\d+)-/` and `continue`d on anything else. dev names
epic-enrolled tasks `E<M>T<N>-<slug>`, so every one was skipped. Two failures,
not one:

- The task never appeared in `active_tasks`, so the router — which upstream
  instructs to route *solely* from probe output and explicitly not to re-scan
  folders — could not find or resume it.
- The folder was also dropped from `folderIds`, which feeds id allocation, so
  `next_task_id` handed out an id **already in use**.

Widened to `/^(?:E\d+)?T(\d+)-/`, capturing the `T` number as the id in both
forms. Also: the id-mismatch parse error named `folder T<N>`, wrong for an epic
folder, now names the real folder; and each task record gained `epic`, with
`hyper-task` pointed at `active_tasks[*].epic` so it need not re-read `task.md`
to render the epic column.

Regression test: the probe fixture gains `tasks/E1T7-epic-enrolled`,
deliberately the highest `T` number so it pins id allocation as well as
visibility. Five assertions. **Verified the test catches the bug** — with the old
regex restored it fails with exactly the two real symptoms:

```
expected next_task_id: 8 ... got 6        <- the id collision
expected active_tasks.length: 3, got 2    <- the invisible task
expected T7 ... in active_tasks
```

### `b33459b` — Repoint user-facing docs and the eval recipe

Every surface still calling `hyper` phased and `hyper-iterate` adaptive. None is
covered by a validator, so all were checked by hand.

`skills/hyper-help/SKILL.md` rewritten (107 → 140 lines) — the file users read
first, and the most actively wrong in the tree: it advertised `/hyper-iterate`,
which no longer exists. Now leads with `hyper` (adaptive, default) and
`hyper-build` (phased), and documents what it never covered: `hyper-digest`,
`hyper-memory`, `hyper-short-story`, `hyper-help`, `hyper-sync clone`,
`epic create --source`, and YOLO mode including which gates it cannot suppress.
Every command was checked against the owning skill's real subcommand list.
Also corrected a pre-existing error: the bugfix line claimed `bugfix: true`
"skips spec for feature bugfixes, skips spec for quick bugfixes" — the quick
lane has no spec phase to skip.

`schema.md`, `docs/hyper7-presentation.md`, `docs/hyper7-presentation.html`,
`docs/index.html` — swapped labels, workflow cards, command tables, and the
runtime walkthrough (which loaded `skills/hyper/SKILL.md` to explain phase
dispatch — now `hyper-build`'s). Skill count 21 → 25.

The two HTML files are generated snapshots with no build script, so they were
edited in place. A blanket rename would have left **both** workflow cards
labelled `hyper` with one still tagged "Phased", so the phased card, its command
chip and the walkthrough were repointed individually and both cards re-read
afterwards to confirm one reads hyper-build/Phased and the other hyper/Adaptive.

`.hyper/recipes/evaluate-hyper-iterate.md` — beyond this step's original scope,
but it referenced two files the merge deleted, so the recipe could not run. Skill
references repointed. Its id, filename, the `/tmp/hyper-iterate-eval-*` clone
dirs and the runner/grader teammate names keep the old spelling on purpose,
because the path guard in `scripts/eval-hooks/validate-iterate-loop.sh` matches
those dirs; a note in the file records why.

### `c62f5b4` — Retarget the loop-skill validator — green

**Issue 3.** Upstream's `5c83fec` rewrote `hyper/SKILL.md` and
`templates/loop.md` without updating `validateHyper()`, so **upstream main has
been shipping 31 validation failures.** Confirmed by bisect: `a0bfe70` exits 0,
`5c83fec` exits 1 with 31.

Retargeted at the shipped rewrite. Highlights:

- `## Task understanding` → `## Understanding`; `## Current route` → `## Route`
- dropped `## Current focus`, `## Current bar`, `## Bar history`,
  `## Part alignment`, `## Route shifts`, `## Existing code and findings` —
  folded into other sections or removed outright
- added `## Constraints`, `## Non-negotiables`, `## Verified outcomes`
- `Status: awaiting approval` / `Approval source: Not yet.` / `Approved at: Not
  yet.` → `Approved: no` + `Pressure-tested: no`
- part statuses `todo | aligning | doing | done` → `todo | current | done`
- cycle entries now assert all five ordered fields (Intent, Move, Evidence,
  Learning, Next) with legal values, replacing the removed `**Prior belief:**`
  and `**Route impact:**`
- `## Authority Modes` → `## Authority`; `**Alignment gate.**` → `**Gate.**`
- added the four phase headings, previously unasserted

All 53 needles were checked against the real files before being written.
**Mutation-tested**: renaming a template section, renaming a phase heading,
weakening the Iron Law, dropping approval from the data model, and replacing
`Approved: no` throughout the template each produce a failure. Note the
gate-state assertion only fails when all three occurrences change — worth knowing
if these are edited later.

This fixes the validator, not the skill. Upstream's rewrite is the intended
design and was left untouched.

### Guard hyper-help against drift

Follow-up to the step above, prompted by asking what `hyper-help` actually costs
when it is not used.

The token answer is "almost nothing": only the frontmatter `description` is
always in context (314 chars, ~78 tokens — the second-smallest of any
user-facing skill). The 5.5KB body loads only on invocation. Across all 25
skills the always-loaded total is ~2,700 tokens against ~33,000 chars of body.

The real costs were elsewhere, and both are now closed:

**Routing collisions.** The description claimed `list`, `usage` and
`how to use` as keywords. `list` is legitimately owned by four other skills
(hyper-task, hyper-backlog, hyper-recipe, hyper-memory), so "list my tasks"
could pull up the help reference instead. The description now scopes itself to
explicit help requests and names the skills it must not intercept, so `list`
appears only inside a negative instruction.

**Unvalidated content.** Nothing checked what was inside hyper-help — only that
the name was registered. That is why it advertised `/hyper-iterate` for the
whole window between upstream's rename and this work. New `validateHyperHelp()`
asserts, all derived from the tree rather than a hand-maintained list:

1. every skill in `USER_FACING_HYPER` is documented
2. every `/hyper*` command it advertises resolves to a real `skills/<name>/`
3. no internal (`user-invocable: false`) skill is offered as a command

Mutation-tested; assertion 2 reproduces the original bug exactly:

```
skills/hyper-help/SKILL.md: advertises /hyper-iterate, but skills/hyper-iterate/
does not exist (stale command after a rename or removal?)
```

Worth recording honestly: the docs step above grew hyper-help 107 -> 140 lines,
adding every subcommand and lane, *before* any guard existed. That made the file
more useful and its drift surface larger at the same time. The guard should have
come first.

`docs/maintaining-hyper.md`'s rename checklist was also extended — including a
step to grep for bare `` `hyper` `` when touching router-adjacent skills, the
trap that cost 44 references in this merge.

## What we took from upstream

| Thing | Why it matters |
|---|---|
| `state.mjs` probe (528 lines + 141 lib + 233 tests) | One read-only call replaces per-skill hand-walking of state root, id math and frontmatter reads at every session entry |
| Loop skill rewrite | 413 → 195 lines; template 222 → 134. Same guarantees, far less text to run and lose track of |
| `hyper-memory` | Memory split out; SessionStart hook deleted; recall is agent-driven. Smaller install surface |
| `install-hyper` hardening | Probe-reachability check + drift guard between the `.claude` and `.agents` copies |
| `hyper-digest` | Persistent scannable-output mode; complements the one-shot `hyper-short-story` |
| CHANGELOG + tags | dev had no release history |

## What we kept from dev

`hyper-jira` (193 lines) and `hyper-sync` (81) ported **untouched** — they never
reference the router by name. `hyper-help` rewritten. The full Jira/YOLO/epic
router integration re-grafted onto `hyper-build`. Epic support carried into the
probe, which upstream never had. `schema.md`, the presentation, `package.json`,
`scripts/deploy.sh`.

25 skills total.

## Deliberately left alone

- **`CHANGELOG.md`** keeps its `hyper-iterate` mentions — a historical record of
  releases where that skill existed. Rewriting it would be wrong.
- **The `hyper-iterate-eval` naming** in the eval recipe and
  `scripts/eval-hooks/validate-iterate-loop.sh` — internally consistent and
  functionally coupled. Renaming is cosmetic churn with breakage risk.
- **`scripts/deploy.sh`** still duplicates `install-hyper`'s glob-based symlink
  install and lacks upstream's probe-reachability check, so a `deploy.sh` install
  can produce a tree where the router's first instruction fails with no
  diagnostic. Both enumerate skills by `find … -exec test -f {}/SKILL.md`, so new
  skills auto-install and no registry edits were needed. Consolidating is a
  follow-up.
- **Two delegation mechanisms.** dev's `yolo:` task frontmatter (phased lane) and
  upstream's `## Authority` / `delegated` + decision proxies (loop lane) express
  the same idea in different vocabularies. Both work; neither was unified. This
  is a real design decision still open.

## Verifying

```bash
node scripts/validate-hyper.mjs                  # must exit 0
for f in $(find . -name '*.test.mjs' -not -path './.git/*'); do node "$f"; done
node skills/hyper-build/scripts/state.mjs        # must emit valid JSON
```

## Open follow-ups

1. Unify or document the `yolo:` vs `delegated` authority split.
2. Retire `scripts/deploy.sh` in favour of `install-hyper`, or port the
   probe-reachability check into it.
3. Consider sending upstream the three bugs found here: the incomplete
   `hyper` → `hyper-build` rename (44 refs), the 31-failure validator, and the
   `AGENTS.md` omission of `hyper-digest`/`hyper-memory`.
4. Decide whether to keep upstream's entry-point naming long-term. Reversing it
   is a small mechanical commit.
