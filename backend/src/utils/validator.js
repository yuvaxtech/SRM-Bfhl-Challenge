/**
 * Validates a single edge string.
 * Valid format: "X->Y" where X and Y are single uppercase letters, X !== Y.
 * Trims whitespace before checking.
 */
function validateEdge(raw) {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  // Must match exactly: one uppercase letter, ->, one uppercase letter
  const pattern = /^[A-Z]->[A-Z]$/;
  if (!pattern.test(trimmed)) return false;
  // Self-loops are invalid
  if (trimmed[0] === trimmed[3]) return false;
  return true;
}

/**
 * Separates input array into valid and invalid entries.
 * Also deduplicates: keeps first occurrence, collects duplicates.
 * Returns { validEdges, invalidEntries, duplicateEdges }
 */
function parseAndClassify(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();  // Track edges already added
  const validEdges = [];        // Ordered, deduplicated valid edges

  for (const raw of data) {
    const trimmed = typeof raw === "string" ? raw.trim() : String(raw).trim();

    if (!validateEdge(trimmed)) {
      // Invalid format
      invalidEntries.push(raw);
      continue;
    }

    if (seenEdges.has(trimmed)) {
      // Duplicate — add to duplicate_edges only once
      if (!duplicateEdges.includes(trimmed)) {
        duplicateEdges.push(trimmed);
      }
    } else {
      seenEdges.add(trimmed);
      validEdges.push(trimmed);
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

module.exports = { validateEdge, parseAndClassify };
