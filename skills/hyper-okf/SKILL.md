---
name: hyper-okf
description: >
  Exhaustive prior investigation before a feature is specified. Resolves the
  unknowns behind a planned feature into a verified Open Knowledge Format (OKF)
  bundle — a portable directory of cross-linked markdown files — so the spec
  written next is grounded on established truth, not guesses. Mandatory
  multi-modal fan-out (codebase archaeology + external research) with
  adversarial verification of every claim; delegates the external/web leg to
  the deep-research skill. Use when a feature needs deep, ground-truth
  investigation before any spec or plan exists. For lighter or already-specified
  work, use hyper-light, hyper, or hyper-build instead — not this. Keywords:
  hyper, okf, investigation, research, prior art, grounding, ground truth, spec
  input, open knowledge format, knowledge bundle, exhaustive.
---

# hyper-okf

Run an exhaustive investigation and freeze its results as a **verified OKF
bundle** the spec is built on. This skill exists for the cases that need deep,
ground-truth research before anyone writes a specification. If the work is
small, lightweight, or already understood, use `hyper-light`, `hyper`, or
`hyper-build` — not this. There is no light mode here; the fan-out is always
exhaustive, by design.

Read [INVESTIGATION.md](INVESTIGATION.md) for the methodology (framing, fan-out,
adversarial verification, contradiction handling). Read [OKF-FORMAT.md](OKF-FORMAT.md)
for the exact bundle format, the evidence-status contract, and the concept
types. Load both before writing any doc.

## The loop

### 1. Frame
Turn the feature intent into an explicit list of **unknowns** — the questions
the spec cannot be written without answering. This list is the scope. Show it
to the user and get a go-ahead before fanning out; the investigation costs real
tokens. For each unknown, mark its modality: `codebase` (truth lives in this
repo) or `external` (truth lives in docs, prior art, vendor/library behavior,
standards).

### 2. Fan out (mandatory, exhaustive)
Investigate every unknown across its modality in parallel:
- **External unknowns** → invoke the `deep-research` skill. It already fans out
  web searches, fetches sources, and verifies claims. Do not reimplement it.
- **Codebase unknowns** → run parallel archaeology agents (Explore /
  general-purpose) that read the real code and report findings with `file:line`.

Cover every unknown. Do not stop early because the first source looked
sufficient — exhaustiveness is the contract.

### 3. Verify (adversarial, mandatory)
No claim enters the bundle on first sight. Every candidate finding faces
skeptic agents that try to **refute** it. Assign an evidence status from the
enum in [OKF-FORMAT.md](OKF-FORMAT.md): `directly-evidenced`, `corroborated`,
`single-source`, `contested`, or `unresolved`. A claim that cannot reach at
least `single-source` is not Evidence — it becomes an Open Question. See
[INVESTIGATION.md](INVESTIGATION.md) §verify for the skeptic protocol and
§contradictions for how to record disagreement as `contested`.

### 4. Capture
Write one OKF doc per concept, cross-linked, citations mandatory. Concept types
are the investigation set — `Evidence`, `Constraint`, `Decision Input`, `Risk`,
`Open Question` — defined in [OKF-FORMAT.md](OKF-FORMAT.md). Code evidence
records the commit SHA so staleness is detectable later.

### 5. Index, gaps, and handoff
After all docs are written:
- Generate `index.md` per directory (progressive disclosure).
- Write `open-questions.md`: everything unresolved, with what is known and what
  is blocking each one. The spec must know the edge of the known truth.
- Write `spec-brief.md`: the single handoff doc — verified constraints,
  decisions the spec author must make, risks, and open questions, each linking
  to its concept. This is what the spec phase reads first.

## Output

A standalone bundle at `./<slug>-okf/` at the repo root (portable, renders on
GitHub, ships in git). It is not placed under `.hyper/`. The spec phase consumes
it by reading `spec-brief.md`.

## Grounding contract (non-negotiable)

- **Cite or it does not exist.** Every claim traces to a source — `file:line`
  for code, a URL or citation for external. Never invent fields, params, URLs,
  or behavior.
- **The spec trusts only `directly-evidenced` and `corroborated`.** Lower
  statuses are usable but must stay flagged. `unresolved` claims live as Open
  Questions, never as Evidence.
- **Preserve conflict.** Contradictory sources are recorded as `contested` with
  both sides, not collapsed into a "winner."
- **Findings go stale.** Code evidence is true as of its commit SHA. The bundle
  states that the spec phase must revalidate `file:line` evidence against
  current code before relying on it.
- **No narration in doc bodies.** Bodies are clean markdown for direct
  consumption — no preamble, apologies, or reasoning trace.
