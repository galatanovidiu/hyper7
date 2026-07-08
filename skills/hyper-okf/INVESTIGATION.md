# Investigation Methodology

How to run the exhaustive investigation that feeds the OKF bundle. The output
format is in [OKF-FORMAT.md](OKF-FORMAT.md); this file is the *how*.

The whole point of `hyper-okf` is rigor: every claim the spec will rest on is
researched across modalities and survives an attempt to refute it. Speed is not
a goal here. If exhaustiveness is not wanted, the wrong skill was chosen.

## Step 1 — Frame the unknowns

Convert the feature intent into a list of **unknowns**: the specific questions
the spec cannot be written without answering. Good unknowns are answerable and
falsifiable ("Does the current importer deduplicate by `order_id`?"), not vague
themes ("understand the importer").

For each unknown, record:
- a one-line question,
- its **modality**: `codebase` (truth is in this repo) or `external` (truth is
  in docs, prior art, a library/vendor, a standard),
- why the spec needs it.

Show the list and the chosen output path (`./<slug>-okf/`) to the user before
fanning out. Generation costs real tokens per unknown.

## Step 2 — Fan out (mandatory, exhaustive)

Investigate every unknown. Run modalities in parallel.

### External unknowns → deep-research
Invoke the `deep-research` skill, passing the unknown as the question. It fans
out web searches, fetches sources, and adversarially verifies claims already —
do not reimplement it here. Capture its cited findings; you will re-verify them
in Step 3 against this bundle's status enum.

### Codebase unknowns → archaeology agents
Launch parallel `Explore` / `general-purpose` agents, one per unknown or per
subsystem. Each reads the real code and returns findings with `file:line` and
the current commit SHA (`git rev-parse HEAD`). Forbid guessing: an agent that
cannot find the answer reports "not found", which becomes an Open Question — it
does not invent one.

Exhaustiveness rule: do not stop because the first source looked sufficient.
Cover every unknown on the list before moving on.

## Step 3 — Verify (adversarial, mandatory)

No candidate finding enters the bundle unchallenged.

For each candidate finding, spawn skeptic agent(s) whose job is to **refute** it:
- find a counter-source, a code path that contradicts it, or a hidden
  assumption;
- default to skepticism — if the refutation is uncertain, the finding is not yet
  `directly-evidenced`.

Assign a `status` from the enum in [OKF-FORMAT.md](OKF-FORMAT.md):
- survives refutation against a primary source / `file:line` → `directly-evidenced`
- ≥2 independent sources agree → `corroborated`
- one source, unrefuted but unconfirmed → `single-source`
- skeptic found a credible contradiction → `contested` (see below)
- cannot be established at all → not Evidence; write an **Open Question**

Watch the shared-source trap: three agents citing the same stale blog post is
**one** source, not three. Corroboration requires *independent* origins.

## Step 4 — Contradictions

When sources or agents disagree and neither side is clearly wrong, do **not**
pick a winner. Write the concept with `status: contested` and a mandatory
`# Disagreement` section recording each side, its source, and why it is
credible. Code-contradicts-docs is the common case: the running code is usually
the operative truth, but record the doc's claim too — the divergence is itself a
Risk the spec must address (mint a `Risk` doc and link it).

## Step 5 — Capture, index, handoff

Write the bundle per [OKF-FORMAT.md](OKF-FORMAT.md):
1. One doc per concept (`Evidence`, `Constraint`, `Decision Input`, `Risk`,
   `Open Question`), cross-linked, citations mandatory, code evidence carrying
   its `commit`.
2. `index.md` per directory.
3. `open-questions.md` — every unresolved unknown, what is known, what blocks it.
4. `spec-brief.md` — the handoff the spec phase reads first.

## Failure modes to handle explicitly

- **Huge unknown space.** If framing produces an unwieldy list, group unknowns
  into themes and tell the user the bundle will be large before fanning out —
  do not silently truncate.
- **Mostly Open Questions.** If the investigation cannot establish enough to
  specify the feature, say so plainly in `spec-brief.md`. An honest "not
  specifiable yet, here is what is blocking" is a valid and valuable outcome —
  do not pad it with `single-source` guesses dressed as Evidence.
- **Stale by the time the spec is written.** Every code `Evidence` doc records
  its `commit`. `spec-brief.md` instructs the spec author to revalidate
  `file:line` evidence against current code first.
