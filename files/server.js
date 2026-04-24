/**
 * server.js — Express app entry point
 */

const express = require("express");
const cors = require("cors");
const { handleBFHL } = require("./controllers/bfhlController");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post("/bfhl", handleBFHL);

// Health check
app.get("/", (req, res) => res.json({ status: "BFHL API running" }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;
