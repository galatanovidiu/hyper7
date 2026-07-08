<!-- GENERATED FILE — do not edit here. Source: shared/reference/change-review.md. Regenerate: node scripts/sync-shared.mjs -->

# Hyper — Change Review

How to review a set of changes and return a verdict. Read by `hyper-build`'s
verify phase and by `hyper`'s loop verify. The caller computes the diff and
owns where the result is written; this file owns only the method.

## Resolve what to review

The caller passes the target. Common shapes:

- a named file or set of files
- the working diff, staged changes, or a branch against its base
- a pull request (`gh pr diff <n>`)
- a Hyper task's diff or a loop's diff against its starting commit

When the target is ambiguous and no caller passed one, ask before reviewing.

## Passes

Run all four against the diff. The first is what makes a Hyper review more than
a generic one.

1. **Contract compliance** — does the change match the task's accepted
   artifacts (`02-spec.md`, `03-technical-plan.md`, `04-execution-plan.md`) or,
   when there are none, the user's request? Flag scope drift and unmet
   acceptance outcomes.
2. **Bugs and regressions** — logic errors, edge cases, races, state leaks,
   security holes, data loss, broken invariants, unhandled failure paths.
3. **Test adequacy** — missing or weak tests for the changed behavior.
4. **Standards** — project conventions and maintainability, per the repo's
   `AGENTS.md`/`CLAUDE.md` and linter config. Material issues only — no style
   nitpicks.

## Verdict

Exactly one:

- `pass` — no blocking findings
- `needs-changes` — actionable issues must be fixed
- `blocked` — review cannot be completed with the information available

## Output

Findings are the primary output. Do not bury them under a summary.

- Order findings by severity. Each cites `file:line`, the concrete mechanism,
  and a suggested fix.
- Every claim references a real `file:line`. Do not fabricate paths, symbols,
  or line numbers. Label a hypothesis as a hypothesis. A verified "unknown"
  beats a plausible guess.
- Zero findings is a valid result — do not invent issues to fill a section.

When the caller is the verify phase, write the result into `checks.md` under
`## review` as the verdict plus the ordered findings. When the caller is a
loop, return the verdict and the top findings for `loop.md`.
