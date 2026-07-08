# Maintaining Hyper

This guide is for humans editing the Hyper repo itself.

## Skill inventory

Ten standalone skills ship: `hyper`, `hyper-light`, `hyper-build`, `hyper-task`,
`hyper-backlog`, `hyper-handoff`, `hyper-retro`, `hyper-recipe`, `hyper-team`,
`hyper-memory`. There are no separate phase
skills. The phase workflow lives as `reference/phase-*.md` files inside
`hyper-build` (`phase-intake.md` … `phase-docs.md`, plus
`phase-execution-plan-review.md` and `phase-worker.md`), which `hyper-build`
reads when it routes a phase.

## Validate the suite locally

The one machine-checkable guard is the sync drift check:

```bash
node scripts/sync-shared.mjs --check
```

It exits non-zero if any synced copy under `skills/**` drifts from its
`shared/` source. CI runs the same command. A broader structural test and
validation suite is to be defined later.

Keep doing real `/hyper` and `/hyper-build` dry runs in a throwaway project for
workflow changes.

## Most fragile contracts

These surfaces are the easiest to drift:

1. **Shared core and the sync build**
   - `shared/` (canonical source: state probe, state-root helper, reference
     docs, templates)
   - `shared/sync.manifest.json`
   - `scripts/sync-shared.mjs` (and `--check`)
   - never hand-edit synced copies under `skills/**`; edit `shared/` and re-sync

2. **Skill inventory and counts**
   - README
   - `shared/reference/data-model.md` (synced to skill copies)
   - this file's skill-inventory section

3. **Gate protocol and transitions**
   - `skills/hyper-build/SKILL.md`
   - phase reference files that set gates
     (`skills/hyper-build/reference/phase-*.md`)
   - `skills/hyper-build/reference/gates.md`
   - README example flows

4. **Phase and artifact naming**
   - `intake`, `spec`, `technical-plan`, `execution-plan`, `research`
   - `01-intake.md`
   - `02-spec.md`
   - `03-technical-plan.md`
   - `04-execution-plan.md`
   - `05-execution-plan-review.md`

5. **Execution-plan review contract**
   - `skills/hyper-build/reference/phase-execution-plan-review.md`
   - `skills/hyper-build/templates/05-execution-plan-review.md`
   - `skills/hyper-build/reference/phase-execution-plan.md`
   - `skills/hyper-build/reference/data-model.md`

6. **Worker-guardrails contract**
   - `skills/hyper-build/reference/worker-guardrails.md`
   - `skills/hyper-build/reference/phase-worker.md`
   - phase reference files that mention the guardrails in their dispatch prompt

7. **`checks.md` contract**
   - `skills/hyper-build/reference/phase-verify.md`
   - `skills/hyper-build/reference/phase-docs.md`
   - `skills/hyper-build/reference/change-review.md` (defines the `## review` block)
   - `skills/hyper-build/templates/checks.md`
   - `skills/hyper-build/reference/data-model.md`

8. **`hyper` loop contract**
   - `skills/hyper/SKILL.md`
   - `skills/hyper/templates/loop.md`
   - `skills/hyper/reference/autonomous-run.md` (the `Run: auto` engine:
     `bar-check` verdict contract, checkpoint/stop-for-user precedence, and the
     machine-checkable-bar gate; keep in sync with the `Run`/`bar-check`/auto-run
     wording in `SKILL.md` and the `Run`/`Check:` fields in `templates/loop.md`)
   - `skills/hyper-build/reference/data-model.md`
   - README loop examples and wording
   - hard gate stays intact: authority -> understanding -> code scan -> findings -> loop plan -> part-level approvals -> cycles; `Run: auto` adds a machine-checkable-bar precondition but never weakens this gate

9. **State probe contract**
   - canonical source: `shared/scripts/state.mjs` and
     `shared/scripts/lib/state-root.mjs` (the read-only Node ESM probe),
     `shared/reference/state-root.md` (the
     probe's contract — invocation, output schema, category mapping, errors,
     env coverage), `shared/reference/data-model.md` (the id-allocation
     references that point at the probe)
   - the probe is vendored into each consuming skill by `scripts/sync-shared.mjs`
     per `shared/sync.manifest.json`; never hand-edit the `skills/**` copies
   - the probe-caller skills each invoke their own local copy
     (`<skill-base-dir>/scripts/state.mjs`): `skills/hyper-build/SKILL.md`,
     `skills/hyper-task/SKILL.md`, `skills/hyper-backlog/SKILL.md`,
     `skills/hyper/SKILL.md`, `skills/hyper-memory/SKILL.md`
   - the indirect consumers each resolve the state root per their own vendored
     `reference/state-root.md`. If that contract changes, edit
     `shared/reference/state-root.md` and re-sync
   - `.claude/skills/install-hyper/scripts/install.sh` and `.agents/skills/install-hyper/scripts/install.sh` (the `verify_probe_reachable` portability check; both files must remain byte-identical; stdout and stderr must stay separated when capturing probe output)
   - keep the probe **read-only**: no writes, no Git mutations, no new external dependencies
   - id allocation is **folder-name-canonical**: the probe scans `T<N>-` / `L<N>-` folder names for next-id math, and surfaces frontmatter-id mismatches as `parse_errors` entries

## When adding or renaming a skill

Do all of these together:

1. add or rename the folder under `skills/`
2. update README
3. update `shared/reference/data-model.md` if the workflow or state model
   changed, then run `node scripts/sync-shared.mjs`
4. update this file's skill-inventory section and counts
5. run `node scripts/sync-shared.mjs --check`
6. grep for stale skill names and stale artifact names

## When changing the data model

Treat `shared/reference/data-model.md` as the canonical source (its skill copies
are synced — do not hand-edit them; edit `shared/` and run
`node scripts/sync-shared.mjs`). At minimum, check:

- `hyper-build` (and its phase reference files, `reference/phase-*.md`)
- `hyper-task`
- `hyper-backlog`
- `hyper-handoff`
- `hyper-retro`
- `hyper-recipe`
- `hyper`
- `hyper-memory`

## Repairing example drift

Typical offenders:

- sample phase flows
- approval-gate wording in README
- task-folder examples
- task artifact lists
- sample `checks.md` or review artifacts

## Human docs vs skill docs

- README and `docs/` are for humans.
- `skills/**/SKILL.md` and `skills/**/reference/*.md` are for agents.
- User-visible changes still require human-facing docs; agent-facing skill
  source does not satisfy the docs phase by itself.
