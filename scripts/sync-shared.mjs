#!/usr/bin/env node

// Vendors the canonical shared core into consuming skills.
//
// The single source of truth lives in `shared/`. This tool copies each
// declared file into `skills/<skill>/` as a byte-identical copy, so a
// GENERATED header in the source propagates verbatim to every copy.
//
// Usage:
//   node scripts/sync-shared.mjs            Copy shared/ -> skills/<skill>/.
//   node scripts/sync-shared.mjs --check    Verify copies match source; exit
//                                           non-zero on any drift or missing
//                                           target.
//
// The manifest (`shared/sync.manifest.json`) maps each consuming skill to the
// subset of core files it receives.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sharedDir = path.join(repoRoot, "shared");
const manifestPath = path.join(sharedDir, "sync.manifest.json");

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function loadManifest() {
  let text;
  try {
    text = fs.readFileSync(manifestPath, "utf8");
  } catch (err) {
    die(`sync-shared: cannot read manifest ${manifestPath}: ${err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    die(`sync-shared: manifest is not valid JSON: ${err.message}`);
  }
}

const skillsDir = path.join(repoRoot, "skills");

// Rejects a path component that would escape its intended root. A valid
// segment must not be empty, absolute, or contain a `..` traversal part.
function assertSafeSegment(kind, value) {
  if (typeof value !== "string" || value.length === 0) {
    die(`sync-shared: ${kind} must be a non-empty string`);
  }
  if (path.isAbsolute(value)) {
    die(`sync-shared: ${kind} must be relative, got ${JSON.stringify(value)}`);
  }
  const parts = value.split(/[/\\]/);
  if (parts.includes("..")) {
    die(
      `sync-shared: ${kind} must not contain '..', got ${JSON.stringify(value)}`,
    );
  }
}

// Confirms `resolved` stays inside `root` after path resolution. Guards
// against symlink-free traversal that slips past the segment check.
function assertInside(kind, root, resolved) {
  const rel = path.relative(root, resolved);
  if (rel === "" || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    die(
      `sync-shared: ${kind} ${JSON.stringify(resolved)} resolves outside ${root}`,
    );
  }
}

// Flattens the manifest into the list of (skill, file, source, target) jobs.
// Each skill key and file path is validated so a malformed manifest cannot
// read from or write to a location outside the shared/ and skills/ roots.
function buildJobs(manifest) {
  const jobs = [];
  for (const [skill, files] of Object.entries(manifest)) {
    assertSafeSegment("skill key", skill);
    if (!Array.isArray(files)) {
      die(`sync-shared: manifest entry for ${JSON.stringify(skill)} is not an array`);
    }
    const skillRoot = path.resolve(skillsDir, skill);
    assertInside("skill key", skillsDir, skillRoot);
    for (const file of files) {
      assertSafeSegment("file path", file);
      const source = path.resolve(sharedDir, file);
      const target = path.resolve(skillRoot, file);
      assertInside("source", sharedDir, source);
      assertInside("target", skillRoot, target);
      jobs.push({ skill, file, source, target });
    }
  }
  return jobs;
}

function runCopy(jobs) {
  const written = [];
  for (const job of jobs) {
    let bytes;
    try {
      bytes = fs.readFileSync(job.source);
    } catch (err) {
      die(`sync-shared: cannot read source ${job.source}: ${err.message}`);
    }
    fs.mkdirSync(path.dirname(job.target), { recursive: true });
    fs.writeFileSync(job.target, bytes);
    written.push(`skills/${job.skill}/${job.file}`);
  }

  process.stdout.write(`sync-shared: wrote ${written.length} file(s):\n`);
  for (const rel of written) {
    process.stdout.write(`  ${rel}\n`);
  }
}

function runCheck(jobs) {
  const problems = [];
  for (const job of jobs) {
    let source;
    try {
      source = fs.readFileSync(job.source);
    } catch (err) {
      die(`sync-shared: cannot read source ${job.source}: ${err.message}`);
    }

    let target;
    try {
      target = fs.readFileSync(job.target);
    } catch {
      problems.push(`missing: skills/${job.skill}/${job.file}`);
      continue;
    }

    if (!source.equals(target)) {
      problems.push(`drift: skills/${job.skill}/${job.file}`);
    }
  }

  if (problems.length > 0) {
    process.stderr.write("sync-shared: shared core is OUT OF SYNC\n");
    for (const problem of problems) {
      process.stderr.write(`  ${problem}\n`);
    }
    process.stderr.write("Run: node scripts/sync-shared.mjs\n");
    process.exit(1);
  }

  process.stdout.write("shared core in sync\n");
}

function main() {
  const argv = process.argv.slice(2);
  let check = false;
  for (const arg of argv) {
    if (arg === "--check") {
      check = true;
      continue;
    }
    die(`sync-shared: unknown argument ${JSON.stringify(arg)}`);
  }

  const manifest = loadManifest();
  const jobs = buildJobs(manifest);

  if (check) {
    runCheck(jobs);
  } else {
    runCopy(jobs);
  }
}

main();
