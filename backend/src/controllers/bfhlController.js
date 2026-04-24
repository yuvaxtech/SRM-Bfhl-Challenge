/**
 * bfhlController.js
 * Handles POST /bfhl — orchestrates validation, tree building, and response formatting.
 */

const { parseAndClassify } = require("../utils/validator");
const { processEdges } = require("../utils/treeBuilder");

// Static user info — replace with real values before submission
const USER_ID = "yuvarajk_11062006";
const EMAIL_ID = "yk1233@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311008050014";

/**
 * POST /bfhl
 * Body: { "data": ["A->B", "A->C", ...] }
 */
function handleBFHL(req, res) {
  const { data } = req.body;

  // Validate request body structure
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      error: "Invalid request: 'data' must be an array.",
    });
  }

  // Step 1: Parse, validate, deduplicate
  const { validEdges, invalidEntries, duplicateEdges } = parseAndClassify(data);

  // Step 2: Build trees / detect cycles
  const { hierarchies, summary } = processEdges(validEdges);

  // Step 3: Format response
  return res.status(200).json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  });
}

module.exports = { handleBFHL };
