<!-- GENERATED FILE — do not edit here. Source: shared/reference/archive.md. Regenerate: node scripts/sync-shared.mjs -->

# Hyper — Archive Contract

Terminal task folders move from `.hyper/tasks/` to `.hyper/archive/`.

`hyper-build` archives phase-driven `done` tasks after applying the transition table.
`hyper-task` archives user-cancelled tasks.

The phases (intake, research, verify, docs, etc.) never run the archive move
themselves. They return `phase-complete`; `hyper-build` applies the transition
table, sets `phase: done`, and moves the folder.

By-id lookups search `.hyper/tasks/` first, then `.hyper/archive/`. Normal
active-task routing ignores archived folders.
