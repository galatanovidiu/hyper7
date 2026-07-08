// hyper-workflows batch template. Copy to .hyper/workflows/<workflow-name>/NN-<batch>/workflow.js and fill CONFIG + SPECS.
// One workflow = one batch. pipeline(SPECS, build, review -> fixIfBlockers).
// Authored in the PLAN session; invoked by the RUN session. Reads its sibling spec.md.

export const meta = {
  name: 'W<n>-<cluster>',                          // FILL: unique name
  description: 'Build N <cluster> items from the project recipe, adversarially review each, fix blockers',
  phases: [
    { title: 'Build', detail: 'one subagent per item; reads recipe + checklist + spec + exemplar, writes file+test, self-lint' },
    { title: 'Review', detail: 'adversarial audit vs the checklist + the spec' },
    { title: 'Fix', detail: 'apply blockers if the review found any' },
  ],
}

// ── CONFIG: fill these paths for the project ────────────────────────────────
const RECIPE    = '<abs path to the ITEM build guide>'   // e.g. .claude/skills/wp-abilities/BUILDING.md
const CHECKLIST = '<abs path to the review checklist>'
const SPECDOC   = '<abs path to this batch spec>'        // build agents may read the full spec
const REF       = '<abs path to the authoritative source to verify semantics against>'

const COMMON = `You are a build subagent producing ONE item at the project's quality bar. Everything you need is in the recipe and the batch spec; you have no other context.

MANDATORY first step — Read IN FULL before writing: ${RECIPE}, ${CHECKLIST}, ${SPECDOC}, and the exemplar named in your spec (the live file is the source of truth).

Rules: wrap existing behavior, never reinvent it. Verify runtime semantics against the authoritative source (${REF}) — do NOT guess. Match the project's exact craft (naming, schema, descriptions).

Deliverables:
1. The item file at <target folder>/<Name>.<ext> (follow the project's contract + conventions).
2. The test at the mirrored test path, covering the standard cases the spec lists.
3. Run the project's FAST self-check only (e.g. a syntax lint) on both files; fix any error.

HARD RULES:
- Do NOT edit any shared/driver-owned file (registry, index, category list, shared test map) — the driver does those.
- Do NOT run the full type-check/lint/test suite and do NOT run VCS — the driver verifies + lands.
Return the structured report; in skill_gaps list every place the recipe/checklist/spec left you guessing (empty if none).`

// ── SPECS: one entry per item in this batch ─────────────────────────────────
const SPECS = [
  // { item: 'domain/verb-noun', label: 'short label', spec: `WHAT / WRAP+source / INPUT / OUTPUT / GUARD / ERROR / CLASS / EXEMPLAR / TESTS` },
]

const BUILD = {
  type: 'object',
  required: ['item', 'item_file', 'test_file', 'classification', 'self_check_ok', 'skill_gaps', 'summary'],
  additionalProperties: false,
  properties: {
    item: { type: 'string' },
    item_file: { type: 'string', description: 'absolute path written' },
    test_file: { type: 'string', description: 'absolute path written' },
    classification: { type: 'string', description: 'the risk/shape decision chosen' },
    self_check_ok: { type: 'boolean' },
    skill_gaps: { type: 'array', items: { type: 'string' }, description: 'every place the recipe/checklist/spec left you guessing; empty if none' },
    summary: { type: 'string', description: '2-4 sentences: what you built + any notable decision' },
  },
}

const REVIEW = {
  type: 'object',
  required: ['item', 'verdict', 'blockers', 'should_fix', 'nits'],
  additionalProperties: false,
  properties: {
    item: { type: 'string' },
    verdict: { type: 'string', description: 'Pass | Needs changes | Blocked' },
    blockers: { type: 'array', items: { type: 'string' }, description: 'execution failure, weak guard, wrong/unsafe classification, wrong semantics — with file:line' },
    should_fix: { type: 'array', items: { type: 'string' } },
    nits: { type: 'array', items: { type: 'string' } },
  },
}

const FIX = {
  type: 'object',
  required: ['item', 'applied', 'changes', 'self_check_ok', 'remaining'],
  additionalProperties: false,
  properties: {
    item: { type: 'string' },
    applied: { type: 'boolean' },
    changes: { type: 'array', items: { type: 'string' } },
    self_check_ok: { type: 'boolean' },
    remaining: { type: 'array', items: { type: 'string' }, description: 'blockers NOT fixable within this item; empty if all handled' },
  },
}

phase('Build')

const results = await pipeline(
  SPECS,
  (s) => agent(`${COMMON}\n\n=== YOUR SPEC ===\n${s.spec}`, { label: `build:${s.item}`, phase: 'Build', schema: BUILD, effort: 'high' }),
  (build, s) => {
    if (!build) return { build: null, review: null, fix: null, spec: s.item }
    return agent(
      `Adversarially review a freshly-built item against the project's quality bar. Read ${CHECKLIST} and the batch spec (your item's section), then read the built files IN FULL:\n  item: ${build.item_file}\n  test: ${build.test_file}\nOpen the exemplar and the authoritative source (${REF}) to check any semantic claim. Run the checklist. Be adversarial about: does it execute, is the guard correct and not weaker than the source, is the classification honest, does the contract read clearly, are the spec's test cases present and exact. Classify findings as blockers (execution failure, weak/wrong guard, wrong semantics — give file:line), should_fix, or nits. Verdict = Pass only if zero blockers.`,
      { label: `review:${s.item}`, phase: 'Review', schema: REVIEW, effort: 'high' },
    ).then(async (review) => {
      if (review && review.verdict !== 'Pass' && Array.isArray(review.blockers) && review.blockers.length > 0) {
        const fix = await agent(
          `A reviewer found BLOCKERS in a freshly-built item. Fix every blocker, change nothing else. Read ${RECIPE} + ${CHECKLIST} + the batch spec if you need a rule, the two files, and the authoritative source (${REF}) to confirm semantics. Do NOT edit shared/driver-owned files.\n  item: ${build.item_file}\n  test: ${build.test_file}\nBLOCKERS to fix:\n${review.blockers.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}\nAfter editing, re-run the fast self-check on both files. Return what you changed per blocker and any blocker you could NOT fix within this item's scope (remaining).`,
          { label: `fix:${s.item}`, phase: 'Fix', schema: FIX, effort: 'high' },
        )
        return { build, review, fix, spec: s.item }
      }
      return { build, review, fix: null, spec: s.item }
    })
  },
)

const ok = results.filter((r) => r && r.build)
const blockerCount = ok.reduce((n, r) => n + (r.review?.blockers?.length || 0), 0)
const gapCount = ok.reduce((n, r) => n + (r.build.skill_gaps?.length || 0), 0)
log(`Built ${ok.length}/${SPECS.length}; review blockers: ${blockerCount}; skill_gaps: ${gapCount}`)

// Return a COMPACT digest only — the driver reads this into its main context, so omit the
// verbose per-agent prose (build/review summaries live in the workflow transcript / agent jsonl).
return {
  built: ok.length,
  total: SPECS.length,
  blockers: blockerCount,
  gaps: gapCount,
  items: ok.map((r) => ({
    item: r.build.item,
    file: r.build.item_file,
    test: r.build.test_file,
    verdict: r.review?.verdict ?? null,
    blockers: r.review?.blockers ?? [],
    unfixed: r.fix?.remaining ?? [],
  })),
  allSkillGaps: ok.flatMap((r) => r.build.skill_gaps || []),
}
