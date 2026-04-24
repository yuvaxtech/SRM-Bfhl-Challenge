/**
 * treeBuilder.js
 * Builds tree structures from a list of valid edges.
 * Handles: multi-parent (keep first), cycle detection, depth calculation.
 */

/**
 * Build an adjacency map and parent map from edges.
 * Multi-parent rule: if a node already has a parent, ignore subsequent parent edges.
 *
 * @param {string[]} edges - e.g. ["A->B", "A->C", "B->D"]
 * @returns {{ children: Map<string,string[]>, parentOf: Map<string,string>, nodes: Set<string> }}
 */
function buildGraph(edges) {
  const children = new Map();  // parent -> [child, child, ...]
  const parentOf = new Map();  // child -> parent (only first parent kept)
  const nodes = new Set();

  for (const edge of edges) {
    const [parent, child] = edge.split("->").map((s) => s.trim());
    nodes.add(parent);
    nodes.add(child);

    // Multi-parent rule: only the first parent edge for a child is kept
    if (parentOf.has(child)) {
      // Already has a parent — ignore this edge completely
      continue;
    }

    parentOf.set(child, parent);

    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(child);
  }

  return { children, parentOf, nodes };
}

/**
 * Detect a cycle in a directed graph using DFS with coloring.
 * Colors: 0 = unvisited, 1 = in stack, 2 = done
 * Returns true if cycle exists.
 */
function hasCycleInGraph(children, nodes) {
  const color = new Map();
  for (const n of nodes) color.set(n, 0);

  function dfs(node) {
    color.set(node, 1); // Mark as in-stack
    for (const child of (children.get(node) || [])) {
      if (color.get(child) === 1) return true;  // Back edge = cycle
      if (color.get(child) === 0 && dfs(child)) return true;
    }
    color.set(node, 2); // Done
    return false;
  }

  for (const node of nodes) {
    if (color.get(node) === 0) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

/**
 * Find all root nodes — nodes that are not a child of any other node.
 * If every node has a parent (pure cycle), return empty array.
 */
function findRoots(nodes, parentOf) {
  const roots = [];
  for (const node of nodes) {
    if (!parentOf.has(node)) roots.push(node);
  }
  return roots.sort(); // Sort lexicographically for determinism
}

/**
 * Build a tree object rooted at `root` using BFS/DFS.
 * Returns nested object: { B: { D: {} }, C: {} }
 */
function buildTreeObject(root, children) {
  const node = {};
  for (const child of (children.get(root) || [])) {
    node[child] = buildTreeObject(child, children);
  }
  return node;
}

/**
 * Calculate depth (longest root-to-leaf path node count) of a tree.
 */
function calcDepth(root, children) {
  const kids = children.get(root) || [];
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((c) => calcDepth(c, children)));
}

/**
 * Count total nodes in a tree rooted at `root`.
 */
function countNodes(root, children) {
  return 1 + (children.get(root) || []).reduce((acc, c) => acc + countNodes(c, children), 0);
}

/**
 * Main function: process valid edges into hierarchies.
 *
 * @param {string[]} validEdges
 * @returns {object} { hierarchies, summary }
 */
function processEdges(validEdges) {
  // Handle empty input
  if (validEdges.length === 0) {
    return {
      hierarchies: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" },
    };
  }

  const { children, parentOf, nodes } = buildGraph(validEdges);

  // Detect cycles globally
  const cycleExists = hasCycleInGraph(children, nodes);

  if (cycleExists) {
    // Cycle case: return one entry with has_cycle: true, no depth
    // Per spec, we still report the "tree" as empty object
    return {
      hierarchies: [{ tree: {}, has_cycle: true }],
      summary: { total_trees: 0, total_cycles: 1, largest_tree_root: "" },
    };
  }

  // No cycles — find roots and build trees
  let roots = findRoots(nodes, parentOf);

  // If no roots found despite no cycle — fallback (shouldn't happen after cycle check)
  // But as safety: pick lex smallest node
  if (roots.length === 0) {
    roots = [Array.from(nodes).sort()[0]];
  }

  const hierarchies = [];
  let largestSize = -1;
  let largestRoot = "";

  for (const root of roots) {
    const tree = buildTreeObject(root, children);
    const depth = calcDepth(root, children);
    const size = countNodes(root, children);

    hierarchies.push({ root, tree: { [root]: tree }, depth });

    if (size > largestSize) {
      largestSize = size;
      largestRoot = root;
    }
  }

  return {
    hierarchies,
    summary: {
      total_trees: hierarchies.length,
      total_cycles: 0,
      largest_tree_root: largestRoot,
    },
  };
}

module.exports = { processEdges };
