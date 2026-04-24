# BFHL Full Stack Challenge — SRM Round 1

Tree hierarchy parser with cycle detection, multi-parent handling, and duplicate edge tracking.

---

## Project Structure

```
bfhl-challenge/
├── backend/
│   ├── src/
│   │   ├── server.js                  # Express entry point
│   │   ├── controllers/
│   │   │   └── bfhlController.js      # POST /bfhl handler
│   │   └── utils/
│   │       ├── validator.js           # Edge validation + dedup
│   │       └── treeBuilder.js         # Tree construction + cycle detection
│   ├── tests/
│   │   └── test.js                    # 24 test cases (no external deps)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   └── App.jsx                    # Full React UI with tree visualizer
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Run Locally

### Backend
```bash
cd backend
npm install
npm start          # http://localhost:3001

# Run tests (no npm install needed)
node tests/test.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

> The Vite dev server proxies `/bfhl` → `http://localhost:3001` so no CORS config needed.

### Quick API test (curl)
```bash
curl -X POST http://localhost:3001/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D"]}'
```

---

## Deploy

### Backend → Render.com (free tier)

1. Push repo to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `node src/server.js`
5. Add env var: `PORT=3001`
6. Click **Deploy**

### Frontend → Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Settings:
   - **Root directory**: `frontend`
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add env var:
   - `VITE_API_URL=https://your-render-url.onrender.com/bfhl`
4. Update `App.jsx` line:
   ```js
   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/bfhl";
   ```
5. Click **Deploy**

---

## API Reference

### POST /bfhl

**Request:**
```json
{ "data": ["A->B", "A->C", "B->D"] }
```

**Response:**
```json
{
  "user_id": "srm_student_001",
  "email_id": "student@srmist.edu.in",
  "college_roll_number": "RA2111003010001",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "D": {} }, "C": {} } }, "depth": 3 }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| `"hello"`, `"1->2"`, `"AB->C"` | → `invalid_entries` |
| `"A->A"` (self-loop) | → `invalid_entries` |
| `"  A->B  "` (spaces) | Trimmed → valid |
| `"A->B"` repeated 3× | First kept, one entry in `duplicate_edges` |
| Node with 2 parents (e.g. `A->B` + `C->B`) | First parent kept, second edge ignored |
| Cycle (`A->B`, `B->A`) | `{ "tree": {}, "has_cycle": true }`, no depth |
| Multiple independent trees | Each gets its own hierarchy entry |
| Empty `data: []` | Empty `hierarchies`, zeroed `summary` |
