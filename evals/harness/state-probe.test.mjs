import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Exercises the exit-code contract of the canonical state probe. The probe is
// a standalone script that calls main() at load and writes JSON to stdout, so
// it is driven as a subprocess (the way install.sh and the skills invoke it)
// rather than imported.
const here = path.dirname(fileURLToPath(import.meta.url));
const PROBE = path.resolve(here, "..", "..", "shared", "scripts", "state.mjs");

// Builds a temp .hyper state tree. `loops` maps folder name -> loop.md body
// (or null to leave the folder without a loop.md). No git init: passing --from
// to an absolute path with a .hyper dir is enough for the probe to resolve.
function makeStateDir(loops = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "state-probe-"));
  const hyper = path.join(root, ".hyper");
  fs.mkdirSync(path.join(hyper, "tasks"), { recursive: true });
  fs.mkdirSync(path.join(hyper, "archive"), { recursive: true });
  fs.mkdirSync(path.join(hyper, "loops"), { recursive: true });
  for (const [name, body] of Object.entries(loops)) {
    const dir = path.join(hyper, "loops", name);
    fs.mkdirSync(dir, { recursive: true });
    if (body != null) fs.writeFileSync(path.join(dir, "loop.md"), body);
  }
  return root;
}

function runProbe(root) {
  const res = spawnSync(process.execPath, [PROBE, "--from", root], {
    encoding: "utf8",
  });
  return {
    status: res.status,
    stdout: res.stdout,
    stderr: res.stderr,
    json: res.status === 2 || res.stdout ? safeJson(res.stdout) : null,
  };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const DONE_LOOP = "---\nid: L1\ntitle: Done loop\nstatus: done\nupdated: 2026-06-22\n---\n\nbody\n";
const DONE_LOOP_2 = "---\nid: L2\nstatus: done\n---\n\nbody\n";
const BROKEN_LOOP = "no frontmatter at all\n";

test("done-only loops exit 0 with empty parse_errors", () => {
  const root = makeStateDir({ "L1-done": DONE_LOOP });
  try {
    const { status, stderr, json } = runProbe(root);
    assert.equal(status, 0, `expected exit 0, got ${status} (stderr: ${stderr})`);
    assert.equal(stderr, "");
    assert.deepEqual(json.parse_errors, []);
    assert.deepEqual(json.active_loops, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("every loop done is still a clean parse, not a failure", () => {
  const root = makeStateDir({ "L1-done": DONE_LOOP, "L2-done": DONE_LOOP_2 });
  try {
    const { status, json } = runProbe(root);
    assert.equal(status, 0);
    assert.deepEqual(json.parse_errors, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a genuinely unparseable loop.md still exits 2", () => {
  const root = makeStateDir({ "L1-broken": BROKEN_LOOP });
  try {
    const { status, stderr } = runProbe(root);
    assert.equal(status, 2, "all candidate folders failing to parse must exit 2");
    assert.match(stderr, /every candidate task\/loop folder failed to parse/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a done loop next to a broken loop exits 0 and surfaces the break", () => {
  const root = makeStateDir({ "L1-done": DONE_LOOP, "L2-broken": BROKEN_LOOP });
  try {
    const { status, json } = runProbe(root);
    assert.equal(status, 0, "at least one folder parsed, so no exit 2");
    assert.equal(json.parse_errors.length, 1);
    assert.match(json.parse_errors[0].path, /L2-broken/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
