# Writing a batch's workflow.js

For each batch, write its dynamic-workflow script at
`.hyper/workflows/<workflow-name>/NN-<batch>/workflow.js`, from
[../templates/workflow.js](../templates/workflow.js). Author it in the PLAN session; the RUN session
invokes it. One script per batch keeps each run independent and resumable. The script reads its
sibling `spec.md` and points build agents at it.

## The shape (don't deviate without reason)

```
pipeline(SPECS,
  build,                 // 1 subagent / item: read recipe + checklist + spec + exemplar, write item + test, self-lint only
  review→fixIfBlockers)  // adversarial audit vs the checklist; if blockers, a fix agent applies them, re-lints
→ returns a COMPACT digest: { built, total, blockers, gaps, items[{item,file,test,verdict,blockers,unfixed}], allSkillGaps[] }
```

**Return compact, not verbose.** The driver reads the workflow's return into its main context, so the
script must NOT return full per-agent prose (the multi-sentence build/review summaries). Return only the
decision-relevant slice: counts, each item's file/test path + verdict + any blockers + any unfixed
blocker, and `allSkillGaps`. The verbose per-agent detail stays in the workflow's own transcript (drill
into `/workflows` or the agent jsonl if you ever need it). This is the single biggest lever on driver
context.

- **build** — one agent per item. Its prompt = the shared `COMMON` block + that item's `spec`.
- **review** — adversarial audit against the project's checklist; verdict + blockers/should_fix/nits.
- **fixIfBlockers** — runs only when the review returns blockers; applies them, re-lints, reports
  what it could not fix (`remaining`).
- Use a structured `schema` on every stage so results come back validated, not parsed.

## The COMMON block (the guardrails every build agent gets)

Adapt per project, but always include:

- **Read first, in full:** the ITEM recipe (the build guide), the checklist, the batch spec, and the
  named exemplar. The live files are the source of truth.
- **Wrap, don't reinvent.** Verify runtime semantics against the authoritative source named in the
  spec — guessing semantics is the one error the mechanical gates can miss.
- **Deliverables:** the item file + its test at the mirrored path; run the project's **fast
  self-check only** (e.g. a syntax lint) — NOT the full type-check/lint/tests/VCS (the driver does
  those once).
- **Do NOT touch shared/driver-owned files** (registry, index, category list, shared test map). The
  driver edits those before/after the workflow.
- **Return honest `skill_gaps`** — every place the recipe/checklist/spec left the agent guessing.

## Per-batch parameters

Change only these between batches: the `SPECS` array (one entry per item: `{ item, label, spec }`),
the target folder, the exemplar paths, and the recipe/checklist paths in `COMMON`. Keep the schemas
and the pipeline wiring identical so every batch behaves the same.

## Iterate

Each `Workflow` invocation persists its script under the session dir and returns the path. To
iterate, edit that file and re-invoke `Workflow({ scriptPath })` — completed agents return cached
results (same-session resume). A workflow that proves out can be saved as a `/command`
(`/workflows` → `s`).
