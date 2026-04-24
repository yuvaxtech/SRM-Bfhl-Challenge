import { useState, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/bfhl";

const SAMPLE_INPUTS = [
  { label: "Basic Tree", value: '["A->B", "A->C", "B->D"]' },
  { label: "Cycle", value: '["A->B", "B->C", "C->A"]' },
  { label: "Multi-parent", value: '["A->B", "C->B", "A->C"]' },
  {
    label: "Mixed (invalid + dupe)",
    value: '["A->B", "A->B", "hello", "B->D", "1->2"]',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function TreeNode({ node, data, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const children = Object.keys(data[node] || {});
  const indent = depth * 20;

  return (
    <div style={{ marginLeft: indent, fontFamily: "'DM Mono', monospace" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: depth === 0 ? "#ff6b35" : "#b8c5d6",
          fontSize: 13,
          padding: "2px 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ opacity: children.length ? 1 : 0.3 }}>
          {children.length ? (open ? "▾" : "▸") : "◦"}
        </span>
        <span
          style={{
            color: depth === 0 ? "#ff6b35" : depth === 1 ? "#7dd3fc" : "#94f5b8",
            fontWeight: depth === 0 ? 700 : 400,
          }}
        >
          {node}
        </span>
        {children.length > 0 && (
          <span style={{ color: "#4a5568", fontSize: 11 }}>
            ({children.length} {children.length === 1 ? "child" : "children"})
          </span>
        )}
      </button>
      {open &&
        children.map((child) => (
          <TreeNode key={child} node={child} data={data[node] || {}} depth={depth + 1} />
        ))}
    </div>
  );
}

function HierarchyCard({ h, idx }) {
  if (h.has_cycle) {
    return (
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={styles.cycleBadge}>⚠ CYCLE DETECTED</span>
        </div>
        <p style={{ color: "#fbbf24", fontSize: 13, margin: 0 }}>
          A cycle was found in the graph. No tree structure can be built.
        </p>
      </div>
    );
  }

  const rootNode = h.root;
  const treeData = h.tree;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.treeLabel}>Tree {idx + 1}</span>
        <span style={styles.rootBadge}>Root: {rootNode}</span>
        <span style={styles.depthBadge}>Depth: {h.depth}</span>
      </div>
      <div style={styles.treeArea}>
        <TreeNode node={rootNode} data={treeData} depth={0} />
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span
      style={{
        background: color + "22",
        color: color,
        border: `1px solid ${color}44`,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, items, color, emptyMsg }) {
  if (!items || items.length === 0)
    return (
      <div style={styles.section}>
        <h3 style={{ ...styles.sectionTitle, color }}>{title}</h3>
        <p style={{ color: "#4a5568", fontSize: 13 }}>{emptyMsg}</p>
      </div>
    );
  return (
    <div style={styles.section}>
      <h3 style={{ ...styles.sectionTitle, color }}>
        {title}{" "}
        <span style={{ color: "#4a5568", fontWeight: 400 }}>({items.length})</span>
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item, i) => (
          <Tag key={i} color={color}>
            {item}
          </Tag>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState('["A->B", "A->C", "B->D"]');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawView, setRawView] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    let parsed;
    try {
      parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array.");
    } catch (e) {
      setError("Invalid JSON: " + e.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "API error");
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div style={styles.root}>
      {/* Ambient glow */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.badge}>BFHL Challenge</div>
          <h1 style={styles.title}>
            Tree Hierarchy
            <br />
            <span style={styles.titleAccent}>Visualizer</span>
          </h1>
          <p style={styles.subtitle}>
            POST /bfhl — Parse edges, build trees, detect cycles
          </p>
        </header>

        {/* Input Panel */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Input Edges (JSON Array)</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SAMPLE_INPUTS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setInput(s.value)}
                  style={styles.sampleBtn}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.textarea}
            rows={4}
            spellCheck={false}
            placeholder='["A->B", "A->C", "B->D"]'
          />
          <button
            onClick={submit}
            disabled={loading}
            style={loading ? { ...styles.submitBtn, opacity: 0.5 } : styles.submitBtn}
          >
            {loading ? "Processing…" : "Submit →"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 16 }}>⚠</span> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={styles.results}>
            {/* Meta */}
            <div style={styles.metaBar}>
              <div>
                <span style={styles.metaLabel}>User ID</span>
                <span style={styles.metaVal}>{result.user_id}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Email</span>
                <span style={styles.metaVal}>{result.email_id}</span>
              </div>
              <div>
                <span style={styles.metaLabel}>Roll No</span>
                <span style={styles.metaVal}>{result.college_roll_number}</span>
              </div>
            </div>

            {/* Summary */}
            <div style={styles.summaryBar}>
              {[
                ["Trees", result.summary.total_trees],
                ["Cycles", result.summary.total_cycles],
                ["Largest Root", result.summary.largest_tree_root || "—"],
              ].map(([k, v]) => (
                <div key={k} style={styles.summaryItem}>
                  <span style={styles.summaryVal}>{v}</span>
                  <span style={styles.summaryKey}>{k}</span>
                </div>
              ))}
            </div>

            {/* Hierarchies */}
            <div style={styles.section}>
              <h3 style={{ ...styles.sectionTitle, color: "#ff6b35" }}>
                Hierarchies
              </h3>
              {result.hierarchies.length === 0 ? (
                <p style={{ color: "#4a5568", fontSize: 13 }}>No trees built.</p>
              ) : (
                result.hierarchies.map((h, i) => (
                  <HierarchyCard key={i} h={h} idx={i} />
                ))
              )}
            </div>

            <Section
              title="Invalid Entries"
              items={result.invalid_entries}
              color="#f87171"
              emptyMsg="No invalid entries."
            />
            <Section
              title="Duplicate Edges"
              items={result.duplicate_edges}
              color="#fbbf24"
              emptyMsg="No duplicates found."
            />

            {/* Raw JSON toggle */}
            <div style={styles.section}>
              <button
                onClick={() => setRawView((r) => !r)}
                style={styles.rawBtn}
              >
                {rawView ? "Hide" : "Show"} Raw JSON
              </button>
              {rawView && (
                <pre style={styles.rawPre}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0e1a",
    color: "#e2e8f0",
    fontFamily: "'IBM Plex Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glow1: {
    position: "fixed",
    top: -200,
    left: -200,
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glow2: {
    position: "fixed",
    bottom: -200,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(125,211,252,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "48px 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: { marginBottom: 40 },
  badge: {
    display: "inline-block",
    background: "#ff6b3522",
    color: "#ff6b35",
    border: "1px solid #ff6b3544",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
    fontFamily: "'DM Mono', monospace",
  },
  title: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: "0 0 12px",
    color: "#f0f4f8",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  titleAccent: { color: "#ff6b35" },
  subtitle: { color: "#64748b", fontSize: 15, margin: 0 },
  panel: {
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
    flexWrap: "wrap",
  },
  panelTitle: {
    fontSize: 12,
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
  },
  sampleBtn: {
    background: "#1e2d3d",
    border: "1px solid #2d3f54",
    borderRadius: 6,
    color: "#7dd3fc",
    fontSize: 11,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
  },
  textarea: {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #1e2d3d",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    padding: 14,
    resize: "vertical",
    fontFamily: "'DM Mono', monospace",
    lineHeight: 1.6,
    boxSizing: "border-box",
    outline: "none",
  },
  submitBtn: {
    marginTop: 14,
    background: "#ff6b35",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 32px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  errorBox: {
    background: "#f8717122",
    border: "1px solid #f8717144",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#f87171",
    fontSize: 14,
    marginBottom: 20,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  results: {},
  metaBar: {
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: 10,
    padding: "14px 20px",
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metaLabel: {
    color: "#4a5568",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "'DM Mono', monospace",
    display: "block",
  },
  metaVal: {
    color: "#94a3b8",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
  },
  summaryBar: {
    display: "flex",
    gap: 16,
    marginBottom: 28,
  },
  summaryItem: {
    flex: 1,
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: 10,
    padding: "16px 20px",
    textAlign: "center",
  },
  summaryVal: {
    display: "block",
    fontSize: 28,
    fontWeight: 800,
    color: "#ff6b35",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  summaryKey: {
    display: "block",
    fontSize: 11,
    color: "#4a5568",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "'DM Mono', monospace",
    marginTop: 4,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
    marginBottom: 12,
    marginTop: 0,
  },
  card: {
    background: "#111827",
    border: "1px solid #1e2d3d",
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 12,
  },
  cardHeader: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  treeLabel: {
    fontSize: 11,
    color: "#4a5568",
    fontFamily: "'DM Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  rootBadge: {
    background: "#ff6b3522",
    color: "#ff6b35",
    border: "1px solid #ff6b3540",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
  },
  depthBadge: {
    background: "#7dd3fc22",
    color: "#7dd3fc",
    border: "1px solid #7dd3fc40",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
  },
  cycleBadge: {
    background: "#fbbf2422",
    color: "#fbbf24",
    border: "1px solid #fbbf2440",
    borderRadius: 4,
    padding: "3px 10px",
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
  },
  treeArea: {
    background: "#0d1117",
    borderRadius: 6,
    padding: "12px 16px",
    border: "1px solid #1e2d3d",
  },
  rawBtn: {
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: 6,
    color: "#64748b",
    fontSize: 12,
    padding: "6px 14px",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    marginBottom: 12,
  },
  rawPre: {
    background: "#0d1117",
    border: "1px solid #1e2d3d",
    borderRadius: 8,
    padding: 16,
    fontSize: 12,
    color: "#94a3b8",
    overflow: "auto",
    fontFamily: "'DM Mono', monospace",
    lineHeight: 1.6,
  },
};
