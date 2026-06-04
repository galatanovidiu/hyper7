# AGENTS.md — Working on Hyper

This repo is **Hyper**: a collection of [Agent Skills](https://agentskills.io) that give AI coding agents a structured development workflow. This file is for agents working **on this repo** (editing skills, fixing docs, etc.), not for agents using Hyper in other projects.

See `README.md` for the user-facing overview and install instructions.

## Two surfaces — do not mix them

**Read this before editing anything.** The repo has two distinct scopes, and every rule below belongs to one of them. Identify the scope of the file you are about to touch before touching it.

1. **Shipped skills** — `skills/**`. These install into other projects and must run on any agent implementing the Agent Skills spec, not just Claude Code. No absolute paths, no references to this repo's `README.md` / `AGENTS.md`, no assumptions about a surrounding dev harness. Authoring rules for this scope live in [.claude/skills/review-hyper-skills/reference/authoring-invariants.md](.claude/skills/review-hyper-skills/reference/authoring-invariants.md).
2. **Repo-local dev surface** — `AGENTS.md` (this file), `README.md`, `.claude/skills/**` (repo-local dev skills like `review-hyper-skills` and `install-hyper`), `docs/`, `scripts/`. Only meaningful for agents editing this repo. This-repo paths, maintained inventories (skill counts, README skill list), and dev tooling live here — never under `skills/`.

Rules from one scope do not apply to the other. If you catch yourself referencing `README.md` from inside a shipped skill, or pulling a shipped-skill rule to police the repo's own inventories, you are mixing scopes. Maintainer-drift concerns (stale inventories, skill counts, repo portability violations) are audited by `review-hyper-skills` Mode 2 and belong in that skill's body, not in the authoring list.

Unless stated otherwise, the normative rules in the rest of this file are for the Hyper suite (`skills/hyper*`) and Hyper-owned docs/artifacts. Bundled companion skills and repo-local dev helpers can have their own structure when they solve different problems.

## Project policies

- **Breaking changes are allowed.** Hyper7 is a new project with a single user (the maintainer). There is no installed user base to keep working. When a rename, restructure, or contract change makes the system clearer, do it cleanly across all touchpoints rather than introducing aliases, shims, or asymmetric naming for backward compatibility. Deprecation paths and dual-name support are explicitly not required.
- **Symmetric naming is preferred.** When a skill renames, its associated phase value, frontmatter field, dispatch-table entry, and any other internal identifier renames with it. Asymmetric naming (skill `X`, phase value `Y`) is a maintenance hazard and should be avoided unless it solves a concrete problem this project actually has.
- **No history breadcrumbs in shipped skills.** Skill source under `skills/**` reads as if the current name is the only name that ever existed. Do not leave prose like "previously named X, now Y", "renamed from Z", "for backward compatibility", or migration notes in `SKILL.md`, `templates/`, or `reference/`. Renames are mechanical replacements, not annotated history. The git log is the history record; the skill source is the present-tense contract. This rule applies to all of `skills/**` — both the Hyper suite and any companion skills shipped from this repo.

## Documentation

- `README.md` is user-facing. It is the single place for human-readable documentation: overview, install, usage, skill list.
- `AGENTS.md` (this file) is agent-facing. Rules, constraints, and conventions for agents editing this repo.
- Additional human-readable docs go under `docs/`. Create the folder when a topic outgrows the README; link from the README.
- Everything under `skills/` — `SKILL.md` bodies, `templates/`, `reference/` — is skill source, not documentation. Do not edit these files during a docs phase or as a "while I'm here" cleanup. Changes to files under `skills/` happen only when a task explicitly targets them.

## What lives where

Hyper skills generally follow this layout:

```
skills/<name>/
  SKILL.md           # required — the skill entry point
  templates/         # optional — fill-in templates referenced by SKILL.md
  reference/         # optional — reference material loaded on demand
```

This layout is normative for the Hyper suite. Bundled companion skills may use a different bundled-file structure when their own workflow needs it.

Each shipped skill is self-contained and individually installable. A shipped skill must not reference files in a sibling skill — no `../<other-skill>/` paths. Shared content (the state probe, state-root helper, reference docs, templates) is authored once in the repo-root `shared/` directory and vendored into each consuming skill by `scripts/sync-shared.mjs` at build time. The unit of distribution is the individual skill: each skill installs standalone (for example via skills.sh `npx skills add`), and the whole suite can still be installed together. The repo-local `install-hyper` helper exists only for the development loop; it is not part of the distributed Hyper package.

## User-facing skills

There are nine standalone user-facing skills: `hyper`, `hyper-build`, `hyper-task`, `hyper-backlog`, `hyper-handoff`, `hyper-retro`, `hyper-recipe`, `hyper-team`, `hyper-memory`. No `user-invocable` field (defaults to `true`). They show up in the slash-command menu, triggered either by `/<name>` or by description auto-activation.

There are no separate internal or phase skills. The phase workflow lives as reference files inside `hyper-build`: `reference/phase-intake.md`, `phase-spec.md`, `phase-technical-plan.md`, `phase-execution-plan.md`, `phase-execution-plan-review.md`, `phase-research.md`, `phase-implement.md`, `phase-worker.md`, `phase-verify.md`, `phase-docs.md`. `hyper-build` reads the matching file when it routes a phase and applies the verdict the file returns.

`hyper-recipe` is standalone and manages `.hyper/recipes/` without entering the task workflow. `hyper` is the main adaptive workflow and manages `.hyper/loops/` without entering the phase workflow; `hyper-build` is the phased workflow and manages `.hyper/tasks/`. Code review is not a skill: both `hyper-build`'s verify phase and `hyper`'s loop verify review the diff per their local `reference/change-review.md`.

## Agent Skills spec constraints

When editing a Hyper `SKILL.md` (`skills/hyper*`), enforce:

**Frontmatter**
- `name`: lowercase letters, numbers, hyphens only. ≤64 chars. Must not contain the reserved words `anthropic` or `claude`.
- `description`: ≤1024 chars. Third person ("Runs the verify phase…", not "I run" or "you run"). Front-load the key use case. Include explicit trigger phrases ("Use when the user asks to…") and a short `Keywords:` line. This is how the host agent decides when to activate the skill — if the description is vague, the skill won't trigger.
- Other fields (`user-invocable`, `allowed-tools`, etc.) only when there's a clear reason.

**Body**
- Keep under 500 lines. Move detail into bundled `templates/` or `reference/` files that the Hyper `SKILL.md` points to.
- Reference bundled files one level deep only (`templates/task.md` — never `templates/subdir/task.md`).
- Write for an agent, not a human reader. Imperative steps, concrete examples, no historical narrative.
- Don't explain things a capable agent already knows. Every token competes with conversation context.

The bundled `hyper-team` companion skill is intentionally not forced into the same package layout; its nested `references/` tree is part of its own design.

## Cross-references between Hyper skills

There are two distinct handoff shapes. Do not confuse them.

Phase handoffs inside the build workflow are local reference reads, not skill invocations. When `hyper-build` routes a phase, the body says:

> Read `reference/phase-<phase>.md` and follow it.

The phase files live inside `hyper-build`; reading one is a bundled-file read, not a host skill-invocation.

Genuine standalone-skill handoffs still invoke by name:

> Invoke the `hyper-<name>` skill.

Not `Follow skills/hyper-<name>/SKILL.md`. Standalone skills are invoked by name (the host's skill-invocation mechanism), not by file path. This applies to `hyper` reaching `hyper-team` or `grill-me` capabilities.

## Portability

Hyper targets **any** agent that supports the Agent Skills spec, not just Claude Code. This constrains edits:

- **No Claude-Code-only tool references** in skill bodies as a general rule (`Skill` tool, Agent tool, Task tool, etc.). Use neutral language: "invoke the X skill", "read the file".
  - **Sub-agent dispatch:** the implement phase (`skills/hyper-build/reference/phase-implement.md`) dispatches worker sub-agents pointed at `reference/phase-worker.md` during feature-scope orchestration. It uses neutral "sub-agent" wording and relies on the host agent's sub-agent mechanism (on Claude Code, the Task tool) to spawn them, because the Agent Skills spec has no neutral primitive for spawning a sub-agent. On agents without equivalent sub-agent-dispatch support, feature-scope orchestration will need a fallback path — treat that as a known limitation, not an invitation to sprinkle Claude-specific tool names into skill bodies.
- **No CLI.** This was a deliberate departure from Hyper4. Don't re-introduce a `hyper` command or any executable. State is markdown on disk, edited directly.
- **No plugin.json / no `.claude-plugin/`.** Distribution is per self-contained skill — each installs standalone via skills.sh (`npx skills add`) — or as the full suite by copying the `skills/` folder. Still no CLI.

## Build process (shared core)

The repo-root `shared/` directory holds the canonical shared files, authored once: the state probe, the state-root helper, reference docs, and templates. `scripts/sync-shared.mjs` vendors byte-identical copies into each consuming skill per `shared/sync.manifest.json`. The synced copies under `skills/**` are generated — never hand-edit them. Edit the `shared/` source and re-run the sync. CI runs `node scripts/sync-shared.mjs --check` to guard drift.

The "no build for consumers" promise still holds: installed skills are pure markdown with everything they need vendored in. The build is a maintainer-only concern; users never run it.

## When adding or renaming a skill

1. Create the folder under `skills/`.
2. Update `README.md` — the skills table and any prose mentioning the skill.
3. If the new skill is chained from another, update that skill's body to reference it by name.
4. Run a grep pass for stray references (old name, old path form).
5. If you use per-skill symlinks in `~/.claude/skills/` for local development, add or refresh the corresponding link for the new folder. Existing wildcard or one-off links do not automatically expose newly added skill directories.

## When touching the data model

`skills/hyper-build/reference/data-model.md` is authoritative for Hyper-owned `.hyper/` layout, `task.md` frontmatter, subtask file shape, and artifact filenames. It is synced from `shared/reference/data-model.md` — edit the canonical source there and re-run `node scripts/sync-shared.mjs`; do not hand-edit the skill copies. Companion-skill subtrees such as `.hyper/team/` are documented by their owning skill/docs. Any change there needs matching updates in `README.md`, the phase reference files in `hyper-build` (`reference/phase-*.md`), the Hyper skills that read/write those artifacts (`hyper-build`, `hyper-task`, `hyper-backlog`, `hyper-handoff`, `hyper-retro`, `hyper-recipe`, `hyper`), and the relevant templates.

## Testing changes locally

The one machine-checkable guard is the sync drift check:

```bash
node scripts/sync-shared.mjs --check
```

It exits non-zero if any synced copy under `skills/**` drifts from its `shared/` source. CI runs the same command. A broader test/validation suite is to be defined later.

Beyond that, the "tests" are exercising Hyper end-to-end on a real project. Rough loop:

1. `ln -sfn $(pwd)/skills/hyper ~/.claude/skills/hyper` (and siblings) — symlink, so edits take effect live.
   If you add a new skill folder, create its link explicitly. Re-running a past wildcard link command does not update already-linked directories by itself.
2. Open Claude Code (or another agent) in a throwaway project.
3. Invoke `/hyper <some task>` and walk through the phases.
4. If a skill triggers wrong or its instructions go off the rails, read the failed session carefully before editing — often it's the description that's misaligned, not the body.

## Design rules

These are the invariants that keep Hyper small. Apply them to every edit, especially when adding surface area feels easier than restructuring.

The canonical list — rule, rationale, and a quick test for each — lives in [.claude/skills/review-hyper-skills/reference/authoring-invariants.md](.claude/skills/review-hyper-skills/reference/authoring-invariants.md). `review-hyper-skills` audits against the same file, so authoring-time and review-time judgments stay aligned.

When an edit grows the skill set — more files, more filename variants, more enum values, more cross-references — check whether it's enforcing one of those rules or violating one.

## Anti-patterns

- **Reintroducing a CLI.** The biggest pain point of Hyper4. Don't.
- **`allowed-tools` without a reason.** It tightens what the host agent can do mid-skill. Only add when genuinely needed.
- **Prose that restates the frontmatter.** If the body starts with "This skill does X and Y…", delete it — the description already said so.
- **Deep reference chains.** `SKILL.md` → `advanced.md` → `details.md` breaks progressive disclosure (agents tend to partial-read nested references).
- **Cross-skill references.** Shipped skills must be self-contained. A skill referencing files in a sibling skill (`../<other-skill>/` paths) is forbidden — the build vendors shared content from `shared/` into each skill instead of cross-referencing. References to repo files outside `skills/` are also forbidden — they don't ship to users.

## References

- Agent Skills spec: https://agentskills.io/specification
- Claude Code skills docs: https://code.claude.com/docs/en/skills
- Best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Reference skills: https://github.com/anthropics/skills
