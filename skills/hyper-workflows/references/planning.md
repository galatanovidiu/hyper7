# PLAN session — decide and script everything, run nothing

Goal: end this session with **zero decisions left**, an ordered batch list, every batch's spec +
`workflow.js` written, and a self-contained RUNBOOK. The RUN session (possibly a different, cold
session) starts from these files alone. You **author** the workflows here; you never run them.

## Step 1 — Scope the work

Inventory the full universe of items to build. Reconcile against what already exists (don't rebuild
shipped work). State the GOAL in one line and list every candidate item grouped by natural cluster
(domain, layer, feature). This list is the raw material for batching.

## Step 2 — Grill to lock every decision

Invoke the **`grilling`** skill on the plan. Drive it cluster by cluster. Settle and record every
choice the user owns — anything a build agent would otherwise guess or that carries risk:

- **Scope cuts** — in vs out, and why. Drop or defer anything irreversible, security-sensitive, or
  wide-blast unless the user explicitly opts in.
- **Per-cluster policy** — the shape decisions that repeat across a cluster (read vs write, which
  variant, the guard/permission, the classification).
- **The fraught forks** — the 2–4 genuinely hard calls (a security boundary, a destructive op, a
  dependency that needs new infra). Decide each explicitly; if the user won't decide now, mark the
  cluster **deferred** so the run never blocks on it.
- **Sequencing** — what must come before what (shared scaffolding first).

Write the locked decisions into the RUNBOOK (Step 5), auditable later.

## Step 3 — Split into batches (W1…Wn)

A batch is the unit of one workflow run and one landing. Size and order by these rules:

- **Independent items.** Ideally one item = one new file, so parallel build agents never conflict.
- **5–9 items per batch.** Comfortably under the workflow caps (16 concurrent / 1000 total) and
  finishes in one window. Smaller for risky/novel clusters. **W1 is the pilot** — keep it small.
- **One landing per batch.** Everything in the batch ships together (one PR / one commit / one
  artifact).
- **Shared scaffolding first.** If a cluster needs a new registry/category/index entry, the driver
  adds it before that batch; order those clusters so the scaffolding lands first.
- **Group by cluster** so a batch shares context and one exemplar.

Produce the ordered list: each batch's cluster → its items, its directory
`.hyper/workflows/<workflow-name>/NN-<batch>/` (2-digit order prefix; the first batch is the pilot),
its VERIFY filter.

## Step 4 — Write each batch's spec + workflow

Author **every** batch here — do not leave any batch as a scope stub for the RUN session to flesh out
later. Authoring is the research-heavy step (reading the source/exemplars to pin down semantics and
shape); doing it now keeps it out of the RUN driver's context, and it forces the hard forks into the
grill (Step 2) where the user can decide — instead of surfacing them mid-run as an unplanned stop.

For each batch directory `.hyper/workflows/<workflow-name>/NN-<batch>/`:

- `spec.md` — the build agents read it. Each item names: WHAT it does; the **idiom/source to wrap** +
  the authoritative reference to verify against (don't let agents guess semantics); INPUT/OUTPUT shape;
  the guard/permission + why; ERROR behavior; classification; an **EXEMPLAR** (a live file to copy);
  the TESTS to write. Add a "notes for the driver" block: which shared files the driver edits, the
  VERIFY filter, any recipe gap to patch.
- `workflow.js` — from [../templates/workflow.js](../templates/workflow.js). See
  [scripting.md](scripting.md). Author it; do **not** run it.

For a very large universe where authoring all specs upfront is impractical, the honest fallback is to
spawn a **spec-author sub-agent per batch in the PLAN session** (it reads the source and writes the
pair, returning a digest) — still in PLAN, still grilled, just parallelized. Never push the authoring
into the RUN session's main context.

## Step 5 — Write the RUNBOOK (the RUN session's entry point)

From [../templates/RUNBOOK.md](../templates/RUNBOOK.md). It must be self-contained — a cold session
reads only it to start:

1. **Profile** — GOAL, ITEM recipe, authoritative source, VERIFY, LAND, DONE, driver-owned files.
2. **Locked decisions** (the grill output).
3. **Ordered W checklist** — each batch's cluster, its directory, its VERIFY filter. Done-state is
   **derived from VCS** (a batch is done when its landing merged / its files exist), not a hand flag.
4. **Pointer** to [running.md](running.md) for the per-iteration algorithm.
5. **Kickoff line** the user runs in the RUN session (attended or `/loop`-wrapped).
6. The **invariants** (from SKILL.md) and the **DONE** condition.

## Step 6 — Preflight (prove the RUN won't stall)

- **Permissions:** seed `.claude/settings.local.json` with an allow list for the commands the run
  needs (VCS, the verify/test runner, the package manager) so an unattended run never prompts.
- **Environment:** whatever the build/verify needs is up and responding.
- **Tree:** clean and synced; no stray in-flight landing.
- **Pilot note:** the RUN session runs W1 fully (build → verify → land) before fanning out the rest,
  especially after any change to the ITEM recipe.

Hand back: "PLAN complete — N batches specced + scripted, RUNBOOK ready. In a new session, run:
`<kickoff>`."
