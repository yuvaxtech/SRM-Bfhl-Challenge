/**
 * tests/test.js
 * Manual test runner — no external test framework needed.
 * Run: node tests/test.js
 */

const { parseAndClassify } = require("../src/utils/validator");
const { processEdges } = require("../src/utils/treeBuilder");

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${label}`);
    console.log(`     Expected: ${e}`);
    console.log(`     Got:      ${a}`);
    failed++;
  }
}

// ─── VALIDATOR TESTS ──────────────────────────────────────────────────────────

console.log("\n📋 Validator Tests");

{
  const { validEdges, invalidEntries, duplicateEdges } = parseAndClassify([
    "A->B", "A->C", "B->D",
  ]);
  assert("Basic valid edges", validEdges, ["A->B", "A->C", "B->D"]);
  assert("No invalids", invalidEntries, []);
  assert("No duplicates", duplicateEdges, []);
}

{
  const { validEdges, invalidEntries } = parseAndClassify([
    "hello", "1->2", "AB->C", "A-B", "A->", "A->A", "",
  ]);
  assert("All invalids rejected", validEdges, []);
  assert("All go to invalid_entries", invalidEntries.length, 7);
}

{
  // Duplicate handling: keep first, report duplicate once even if 3× repeated
  const { validEdges, duplicateEdges } = parseAndClassify([
    "A->B", "A->B", "A->B",
  ]);
  assert("Duplicate: only one in validEdges", validEdges, ["A->B"]);
  assert("Duplicate: reported once", duplicateEdges, ["A->B"]);
}

{
  // Trimming
  const { validEdges, invalidEntries } = parseAndClassify(["  A->B  ", " C->D "]);
  assert("Trim spaces: valid", validEdges, ["A->B", "C->D"]);
  assert("Trim spaces: no invalids", invalidEntries, []);
}

// ─── TREE BUILDER TESTS ───────────────────────────────────────────────────────

console.log("\n🌳 Tree Builder Tests");

{
  // Basic tree: A->B, A->C, B->D
  const { hierarchies, summary } = processEdges(["A->B", "A->C", "B->D"]);
  assert("Basic tree root", hierarchies[0].root, "A");
  assert("Basic tree depth", hierarchies[0].depth, 3);
  assert("Basic tree structure", hierarchies[0].tree, {
    A: { B: { D: {} }, C: {} },
  });
  assert("Summary total_trees", summary.total_trees, 1);
  assert("Summary largest_root", summary.largest_tree_root, "A");
}

{
  // Multi-parent: B has two parents (A and C) — keep A->B (first)
  const { hierarchies } = processEdges(["A->B", "C->B"]);
  // A and C are both roots; B is child of A only
  const aTree = hierarchies.find((h) => h.root === "A");
  const cTree = hierarchies.find((h) => h.root === "C");
  assert("Multi-parent: A->B kept", aTree?.tree, { A: { B: {} } });
  assert("Multi-parent: C is isolated root", cTree?.tree, { C: {} });
}

{
  // Cycle: A->B, B->A
  const { hierarchies, summary } = processEdges(["A->B", "B->A"]);
  assert("Cycle: tree is empty", hierarchies[0].tree, {});
  assert("Cycle: has_cycle true", hierarchies[0].has_cycle, true);
  assert("Cycle: total_cycles = 1", summary.total_cycles, 1);
  assert("Cycle: no depth key", "depth" in (hierarchies[0] || {}), false);
}

{
  // Multiple independent trees: A->B and C->D
  const { hierarchies, summary } = processEdges(["A->B", "C->D"]);
  assert("Multi-tree: total_trees", summary.total_trees, 2);
}

{
  // Empty input
  const { hierarchies, summary } = processEdges([]);
  assert("Empty: no hierarchies", hierarchies, []);
  assert("Empty: total_trees = 0", summary.total_trees, 0);
}

{
  // Deep chain: A->B->C->D->E
  const { hierarchies } = processEdges(["A->B", "B->C", "C->D", "D->E"]);
  assert("Deep chain depth", hierarchies[0].depth, 5);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
