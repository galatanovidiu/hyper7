# OKF Format Contract — Investigation Bundle (v0.1)

OKF (Open Knowledge Format, Google Cloud, 2026) is a directory of UTF-8 markdown
files with YAML frontmatter. No schema registry, no required tooling: if you can
`cat` a file you can read it; if you can `git clone` you can ship it. Spec
source: https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf

This file is self-contained on purpose — `hyper-okf` does not depend on any
other skill for the format. It extends the base OKF contract with the
**investigation** concept types and the **evidence-status** rule that make a
bundle safe to ground a spec on.

## Bundle structure

```
<slug>-okf/
├── index.md            # directory listing (progressive disclosure)
├── spec-brief.md       # THE handoff: constraints + decisions + risks + open questions
├── open-questions.md   # everything unresolved + what blocks each
├── log.md              # optional change history
├── evidence/           # one Evidence doc per verified fact
├── constraints/        # one Constraint doc per hard limit
├── decisions/          # one Decision Input doc per tradeoff the spec must settle
└── risks/              # one Risk doc per danger
```

The layout is a suggestion; group concepts however the investigation suggests.

### Reserved filenames
`index.md` and `log.md` have defined meaning at any level and MUST NOT be used
for concept docs. `spec-brief.md` and `open-questions.md` are this skill's
reserved handoff files at the root. Every other `.md` file is a concept.

## Concept document

A YAML frontmatter block delimited by `---`, then a markdown body.

### Frontmatter

```yaml
---
type: <one of the investigation types below>   # REQUIRED
status: <evidence-status enum>                  # REQUIRED for Evidence/Constraint
resource: <file:line | URL | locator>          # required when a real asset backs it
commit: <git SHA>                              # required for codebase evidence
title: <display name>                          # recommended
description: <one tight sentence>              # recommended — reused in index.md
tags: [<tag>, <tag>]                           # recommended
timestamp: <ISO 8601>                          # recommended — when established
# extra producer keys allowed; consumers preserve unknown keys
---
```

`type` is the only universally required key. Order keys
`type, status, resource, commit, title, description, tags, timestamp`, then the
rest.

### Concept types (investigation set)

| type | meaning |
|------|---------|
| `Evidence` | A verified observation about how something is or behaves. `resource` shows code (`file:line` + `commit`) vs external (URL). Carries a `status`. |
| `Constraint` | A hard limit the spec must respect. Backed by ≥1 Evidence doc (link it). Carries a `status`. |
| `Decision Input` | A tradeoff the spec author must settle. Lists options, each with its backing Evidence and consequences. Does not pick — it informs. |
| `Risk` | A danger the spec must address. States trigger, impact, and the Evidence that it is real. |
| `Open Question` | Unresolved. States what is known, what is blocking, and what would resolve it. The only home for `unresolved` claims. |

Do not invent a `Finding` or `Existing Behavior` type — both are `Evidence`,
distinguished by their `resource`.

### Evidence-status enum (`status:`)

| status | when |
|--------|------|
| `directly-evidenced` | Primary source observed directly: code at `file:line`, or an authoritative spec/doc. |
| `corroborated` | ≥2 independent sources agree. |
| `single-source` | One source only, not independently confirmed. Usable but flagged. |
| `contested` | Sources or agents disagree. Record every side in the body. |
| `unresolved` | Could not be established → this is not Evidence; write it as an Open Question instead. |

**The spec trusts only `directly-evidenced` and `corroborated`.** Everything
else must stay visibly flagged so the spec author treats it with care.

### Body

Standard markdown. Favor structure (headings, lists, tables, fenced code) over
prose. Start with 1–3 short sentences on what the concept is, then conventional
sections. For `contested` docs, a `# Disagreement` section recording each side
and its source is mandatory. End sourced docs with `# Citations`.

## Cross-linking

Concepts link with standard markdown links using **file-relative paths**
(`../evidence/x.md`, never `/evidence/x.md`) so the bundle renders on GitHub.
Only link to docs that exist; do not invent targets; do not link a doc to
itself. A Constraint links the Evidence backing it; a Decision Input links the
Evidence behind each option.

## spec-brief.md (the handoff)

A concept doc with `type: Spec Brief` at the root. It is what the spec phase
reads first. Four sections, each entry linking to its concept doc:

```markdown
---
type: Spec Brief
title: Spec inputs for <feature>
description: Verified ground truth and open decisions for specifying <feature>.
timestamp: 2026-06-28T10:00:00Z
---
# Verified constraints
* [<constraint>](constraints/x.md) — one line. (directly-evidenced)

# Decisions the spec must make
* [<decision>](decisions/y.md) — the tradeoff in one line.

# Risks to address
* [<risk>](risks/z.md) — trigger → impact.

# Open questions
* [<question>](open-questions.md#anchor) — what is blocking it.

# Revalidate before specifying
Code evidence is true as of the commit recorded in each doc. Re-check every
`file:line` Evidence against current code before relying on it.
```

List only `directly-evidenced` and `corroborated` items under "Verified
constraints". Flag any `single-source` or `contested` input explicitly.

## open-questions.md

No frontmatter needed beyond a heading. One section per unresolved question,
each stating what is known, what is blocking, and what would resolve it. Use
stable anchors so `spec-brief.md` can link to them.

## index.md

One per directory, including the root. No frontmatter (root MAY carry
`okf_version: "0.1"`). Body is sections grouped by concept `type`, each entry
linking to a doc with its `description`. Group subdirectories under a
`# Subdirectories` heading linking to their `index.md`.

## log.md (optional)

Date-grouped change history, newest first, ISO `YYYY-MM-DD` headings.

## Conformance

A bundle conforms if:
1. Every non-reserved `.md` file has a parseable YAML frontmatter block.
2. Every frontmatter block has a non-empty `type`.
3. Every `Evidence` and `Constraint` doc has a `status` from the enum.
4. Every codebase `Evidence` doc has a `commit`.
5. `index.md` / `log.md` / `spec-brief.md` / `open-questions.md` follow the
   structures above when present.

Everything else is soft guidance. Never ship a bundle that fails 1–5.
