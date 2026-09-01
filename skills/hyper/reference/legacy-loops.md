# Reading pre-rewrite loop files

Loops created before this skill was rebuilt use a different body layout. Their
frontmatter is unchanged (`id`, `title`, `status`, `created`, `updated`), so the
state probe finds and lists them normally — only the body differs.

This file is the read contract for those loops. A legacy loop is worked in place:
its layout is preserved, nothing is restructured, and no migration is required or
offered.

## Detection

On resume, treat a loop as legacy when its body contains **any** of:

- a removed section: `## Current bar`, `## Bar history`, `## Current focus`,
  `## Part alignment`, `## Route shifts`, `## Task understanding`,
  `## Current route`, `## Existing code and findings`, `## Why`
- the three-line approval block: `Status:` + `Approval source:` + `Approved at:`

Say so once, in one line, on the first resume: the loop predates the current
layout and will be worked in its own format.

## Section mapping

Read the legacy section; it carries the meaning the current name implies.

| Current section | Read instead, in a legacy loop |
|---|---|
| `## Understanding` | `## Task understanding` plus `## Existing code and findings` |
| `## Route` | `## Current route` |
| `## Goal` `Why:` line | the separate `## Why` section |
| current part's plan | the `## Part alignment` block for the part marked current |
| `route:` entries in `## Decisions` | `## Route shifts` |
| `## Handoff cues` `Next atomic move` | `## Current focus`, when `## Handoff cues` is absent or empty |

`## Current bar` and `## Bar history` have no current equivalent. Read them as
context on what the loop held itself to; never treat them as a gate.

## Gate translation

The gate expects `Approved:` and `Pressure-tested:` on the loop plan and on the
current part. Legacy loops carry neither. Translate rather than re-gate — work the
user already approved must not be re-approved.

| Legacy | Read as |
|---|---|
| `Status: approved` + `Approval source: user` + `Approved at: <ts>` | `Approved: user <ts>` |
| `Status: approved` + `Approval source:` naming a proxy + `Approved at: <ts>` | `Approved: proxy <ts>` |
| `Status: awaiting approval`, or `Approved at: Not yet.` | `Approved: no` — needs the Align gate before any cycle |
| no `Pressure-tested:` line anywhere | `covered by loop plan` for an already-approved part; `no` for a part reading `Approved: no` |

An approved legacy part clears the gate on its recorded approval alone. A part
still awaiting approval goes through Phase 2 normally, and its approval is
recorded in the legacy three-line shape so the file stays internally consistent.

In practice the only values that occur are `Status: approved` with
`Approval source: user`, and `Status: awaiting approval` with
`Approval source: Not yet.` — the proxy row is there for completeness. Treat any
other value as awaiting approval and say so rather than guessing.

Part status lives on a `Status:` line inside the part block rather than as a
heading suffix, and uses `todo | aligning | doing | done`. Read `aligning` and
`doing` as the current part. If two parts read `doing`, repair per the interrupt
rules in the skill and log it in `## Decisions`.

Frontmatter `status:` outside `active | done` (for example `complete`) reads as
`done`; the probe will not list the loop as active. Say that rather than treating
the loop as missing.

## Writing to a legacy loop

Keep the file's existing shape:

- Write living state into the legacy section that maps to it — a route change
  overwrites `## Current route`, it does not add a new `## Route`.
- Append cycle entries under the existing `## Cycles` in the **current**
  five-field form (`Intent / Move / Evidence / Learning / Next`). Do not
  reconstruct the retired nine-field shape; entries already there stay as they are.
- Record a route change in `## Route shifts` when that section exists, and also as
  a `route:` entry in `## Decisions`.
- Record approvals in the legacy three-line block when the part already uses it.
- Never create a section the current template dropped, and never delete a legacy
  section that is already there.
- `## Starting point` is normally present in legacy loops — use it as usual,
  including its starting commit at verify. Only when it is genuinely absent, fall
  back to detecting research-only work from the cycle log's `implement` cycles.
  Never add the section to a loop that lacks it.
- `## Verified outcomes` exists in legacy loops; append `Verify N` entries there.

A loop that closes stays in its own format. Nothing converts it.
