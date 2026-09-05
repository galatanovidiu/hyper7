---
name: hyper-help
description: >
  Shows the Hyper command reference: every user-invocable Hyper skill, its subcommands, the phase lanes, and the approval phrases. Use only when the user explicitly asks for Hyper help or a Hyper command reference — for example `/hyper-help`, "what Hyper commands are there", or "what can Hyper do". Do NOT use for questions about how one specific skill behaves, and do NOT use for listing tasks, backlog items, recipes, or memories — those belong to hyper-task, hyper-backlog, hyper-recipe, and hyper-memory respectively. Keywords: hyper-help, hyper commands, hyper command reference, hyper cheatsheet.
---

# hyper-help

Display the Hyper command reference below. No task state reads, no phase dispatch, no `.hyper/` writes. Render and stop.

---

## Hyper Quick Reference

### Workflows

Hyper has two entry points. `hyper` is the default.

| Command | Use it for |
| --- | --- |
| `/hyper <goal>` | Start adaptive work — an OODA loop that course-corrects as it learns. |
| `/hyper L<N>` | Resume a loop by id. |
| `/hyper-build <request>` | Start phased work: intake → plan → implement → verify → done. |
| `/hyper-build T<N>` | Resume a task by id. |

Reach for `hyper` when the route or the goal may change as you learn. Reach for `hyper-build` when both are settled up front and you want fixed phases with approval gates.

### Task Management

| Command | Use it for |
| --- | --- |
| `/hyper-task` | List active tasks. |
| `/hyper-task status T<N>` | Show full status of a specific task. |
| `/hyper-task defer T<N>` | Park an active task to deferred. |
| `/hyper-task cancel T<N> <reason>` | Cancel an in-progress task with a reason. |
| `/hyper-task create <title>` | Create a deferred task to work on later. |

### Epics

| Command | Use it for |
| --- | --- |
| `/hyper-task epic create <title>` | Create a new epic. Add `--source PROJ-42` to record a Jira epic key. |
| `/hyper-task epic add T<N> E<M>` | Enroll an existing task in an epic. |
| `/hyper-task epic list [E<N>]` | List all epics and their tasks, or one epic. |
| `/hyper-build <request> --epic E<N>` | Create a new task pre-enrolled in an epic. |

Epic-enrolled task folders are named `E<M>T<N>-<slug>`; the task id stays the `T` number.

### Context and Collaboration

| Command | Use it for |
| --- | --- |
| `/hyper-backlog <idea>` | Add a future idea to the backlog. |
| `/hyper-backlog list` | List all backlog items. |
| `/hyper-backlog promote B<N>` | Promote a backlog item into a task. |
| `/hyper-handoff` | Write a handoff note when conversation context will be lost. |
| `/hyper-retro` | Record lessons learned after a task or session. |
| `/hyper-recipe` | Manage reusable project-local procedures in `.hyper/recipes/`. |
| `/hyper-code-review` | Review a diff, branch, PR, or staged change outside a task. |
| `/hyper-team` | Ask another AI agent CLI for a second opinion. |
| `/hyper-memory` | Save, list, search, or drop project learnings in `.hyper/memory/`. |

### Output Formatting

| Command | Use it for |
| --- | --- |
| `/hyper-digest` | Toggle scannable digest formatting (BLUF + sections) for long responses. Stays on until turned off. |
| `/hyper-digest off` | Turn digest formatting back off. |
| `/hyper-short-story` | Rewrite the previous response as a short, plain-language narrative. One-shot. |
| `/hyper-help` | Show this reference. |

### Integrations

| Command | Use it for |
| --- | --- |
| `/hyper-jira init <url> --project PROJ` | Set up Jira integration (writes `.hyper/jira.md`). |
| `/hyper-jira PROJ-123` | Import a Jira issue as a Hyper task. |
| `/hyper-jira comment <text>` | Post a comment to the linked Jira issue mid-task. |
| `/hyper-jira status` | Check Jira connectivity. |
| `/hyper-sync init <remote>` | Set up shared `.hyper/` team repo (writes `.hyper/repo.md`). |
| `/hyper-sync clone <remote>` | Clone an existing shared `.hyper/` team repo. |
| `/hyper-sync pull` | Pull latest team state before starting work. |
| `/hyper-sync push` | Push `.hyper/` state after completing a task. |
| `/hyper-sync status` | Show sync status vs. remote. |

Both integrations activate on a config file and are otherwise a no-op: Jira on `.hyper/jira.md`, team sync on `.hyper/repo.md`.

### YOLO mode

Prefix a `hyper-build` request with `yolo` to hand routine approvals to `hyper-team` as a decision proxy instead of stopping for you:

```text
/hyper-build yolo Add rate limiting to the public API.
```

The `intake` and `spec` approval gates still stop for you — they elicit intent a proxy cannot supply. A proxy that cannot decide, or that asks for changes twice without approving, also stops for you.

### Workflows at a Glance

**`hyper` (adaptive)** — the route may change as you learn:

`Load and Route → Align → Cycle (observe → orient → decide → act) → Verify and Close`

Work is tracked as a loop (`L<N>`) split into parts (`P<N>`). Each cycle records one move with its evidence. No cycle runs before the plan is approved; nothing closes `done` without a passing verify.

**`hyper-build` (phased)** — destination and route are both clear up front:

| Lane | Phase sequence |
| --- | --- |
| `feature` | intake → spec → technical-plan → execution-plan → implement → verify → docs → done |
| `quick` | intake → technical-plan → implement → verify → done |
| `research` | intake → research → done |
| `code-review` | review → done |

`bugfix: true` skips `spec` on the `feature` lane. The `quick` lane has no `spec` phase to skip.

### Approval Phrases

At each gate, reply with:

| Phrase | Effect |
| --- | --- |
| `approve` | Accept the artifact and advance to the next phase. |
| `needs changes: <feedback>` | Revise the artifact before advancing. |
| `cancel` | Stop and cancel the task. |

### Examples

```text
/hyper Investigate slow report generation and try a fix.
/hyper L2
/hyper-build Add a login page with email and password.
/hyper-build T3
/hyper-build yolo Bump the SDK and fix the fallout.
/hyper-task
/hyper-task epic create User Authentication
/hyper-build Add JWT refresh token support --epic E1
/hyper-jira PROJ-123
/hyper-sync pull
```
