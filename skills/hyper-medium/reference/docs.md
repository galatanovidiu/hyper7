# Hyper — Loop Docs Instruction

This is the docs capability for `hyper`. It runs as Phase 4 step 3 of a loop,
not as a separate phase. It updates user-facing documentation directly when the
loop changed a user-facing surface.

## When this runs

Run this only when the loop changed a user-facing surface: CLI, UI, API, public
functions, or behavior advertised to users. If the loop changed no user-facing
surface, do not run it — record `n/a — no user-facing surface change` in the
loop's `## Verified outcomes` entry under **Docs** and stop.

## Inputs

- `loop.md` — the loop's goal, definition of done, decisions, and cycle log.
- the loop's full code diff against its starting commit.

There is no `checks.md` and there are no task artifacts in a loop. Read context
from `loop.md` and the diff only.

## Flow

1. Re-read `loop.md` (goal, definition of done, decisions) and the loop diff.
2. Decide which user-facing docs the change requires: README entries, guides,
   reference pages, changelogs, or inline docs for public surfaces.
3. Make only the documentation changes the implemented behavior requires. Do not
   change behavior in this step.
4. If a usually-affected docs surface is deliberately not updated, record that
   choice and its reason in the loop's **Docs** summary.
5. Write the result into the loop's `## Verified outcomes` entry under **Docs**:
   a short summary of what was updated, or `n/a — no user-facing surface change`
   when nothing needed updating.

## Rules

- Make documentation changes only. Never change product or implementation
  behavior here.
- Edit user-facing documentation directly. Do not edit Hyper loop artifacts
  other than the **Docs** field in the loop's `## Verified outcomes` entry.
- Load-bearing docs choices (a deliberate non-update of a usually-affected
  surface, or a divergence from established docs convention) go in `loop.md`
  `## Decisions`, authored as `docs`.
- If writing docs reveals a real product or implementation problem, stop and
  surface it to the user instead of silently changing scope.
