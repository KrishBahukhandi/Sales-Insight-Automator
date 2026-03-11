# 📊 Sales Insight Automator

> **Rabbitt AI** · MERN Stack · Quick-Response Sprint

A full-stack containerized application that ingests CSV/Excel sales data, generates an AI-powered executive brief via **Groq (Llama 3)**, and delivers it directly to a recipient's inbox. Built on the **MERN stack** — MongoDB, Express.js, React, Node.js.

---

## 🗂 Project Structure

```
sales-insight-automator/
├── backend/                         # Node.js / Express API
│   ├── src/
│   │   ├── server.js                # Entry point
│   │   ├── app.js                   # Express app + middleware wiring
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB/Mongoose connection
│   │   │   ├── logger.js            # Winston structured logger
│   │   │   ├── swagger.js           # OpenAPI 3.0 spec
│   │   │   └── Report.js            # Mongoose Report model
│   │   ├── routes/
│   │   │   ├── upload.js            # POST /api/upload (Swagger annotated)
│   │   │   └── health.js            # GET /api/health
│   │   ├── services/
│   │   │   ├── uploadService.js     # File parsing + orchestration
│   │   │   ├── aiService.js         # Groq Llama 3 integration
│   │   │   └── emailService.js      # Nodemailer (SendGrid/SMTP)
│   │   └── middleware/
│   │       ├── rateLimiter.js       # express-rate-limit (10 req/min)
│   │       ├── auth.js              # Optional X-API-Key guard
│   │       └── errorHandler.js      # Global error handler
│   ├── tests/
│   │   └── upload.test.js           # Jest + Supertest integration tests
│   ├── package.json
│   ├── Dockerfile                   # Multi-stage Node.js image
│   └── .dockerignore
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                  # Full single-page application
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── .eslintrc.json
│   ├── package.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
├── docker-compose.yml               # Full MERN stack orchestration
├── .env.example
├── .gitignore
└── sales_q1_2026.csv                # Sample test data
```

---

## 🚀 Quick Start — docker-compose

### Prerequisites
- Docker Desktop ≥ 4.x with Compose v2

```bash
# 1. Clone
git clone https://github.com/your-org/sales-insight-automator.git
cd sales-insight-automator

# 2. Configure
cp .env.example .env
# Edit .env — add GROQ_API_KEY + email credentials

# 3. Run the full MERN stack
docker compose up --build

# URLs:
# → Frontend:   http://localhost:3000
# → API:        http://localhost:5000
# → Swagger UI: http://localhost:5000/api/docs
# → MongoDB:    mongodb://admin:secret@localhost:27017
```

```bash
# Teardown
docker compose down -v   # -v removes mongo_data volume
```

---

## ⚙️ Configuration (`.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq API key (Llama 3-70B) |
| `SENDGRID_API_KEY` | ✅ (or SMTP) | SendGrid email delivery |
| `SMTP_USER` / `SMTP_PASSWORD` | ✅ (or SendGrid) | SMTP credentials |
| `MONGO_URI` | Optional | MongoDB connection string |
| `API_KEY` | Optional | Enable X-API-Key auth guard |
| `FRONTEND_URL` | Optional | CORS allowed origin |
| `VITE_API_URL` | Optional | Backend URL for frontend |

> **Dev mode:** No API keys required — app falls back to rule-based summary and console email logging.

---

## 🔒 Security Architecture

### 1. Helmet.js
Sets 11+ secure HTTP response headers automatically:
- Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, HSTS, and more.

### 2. Rate Limiting (`express-rate-limit`)
- 10 requests per 60-second window per IP on `/api/upload`
- Respects `X-Forwarded-For` from Render/Vercel reverse proxies
- Returns `429` with standard `RateLimit-*` headers

### 3. Input Sanitization
- **`express-mongo-sanitize`** — strips `$` and `.` from user input (NoSQL injection protection)
- **`xss-clean`** — removes XSS payloads from `req.body` and `req.query`
- **`hpp`** — prevents HTTP parameter pollution

### 4. File Validation (Multer)
- Allowlisted MIME types and file extensions only
- 10MB hard size cap enforced at middleware level
- Memory storage — no temp files written to disk

### 5. Input Validation (Service layer)
- Email regex checked before any processing
- Row limit (50,000) and empty-file guard
- Descriptive error responses, no stack traces in production

### 6. Optional API Key Auth
- Set `API_KEY` env var to require `X-API-Key` header on all requests
- Returns `403 Forbidden` on mismatch

### 7. CORS
- Configured via `cors()` middleware
- Set `FRONTEND_URL` to restrict origins in production

---

## 🤖 AI Engine

`aiService.js` — Groq Llama 3-70B via the official `groq-sdk`:

```
Groq (Llama 3-70B) → rule-based deterministic fallback
```

The prompt requests a 300–500 word executive brief structured as:
1. Executive Overview
2. Revenue Performance
3. Product & Regional Insights
4. Operational Highlights
5. Strategic Recommendations

---

## 📧 Email Delivery

`emailService.js` — Nodemailer with priority fallback:

```
SendGrid (via SMTP relay) → Generic SMTP → console log (dev)
```

---

## 🗄️ MongoDB — Report Model

Each successful upload persists a `Report` document:

```js
{
  filename, recipientEmail, rowsAnalyzed, columnsDetected,
  summaryPreview, aiProvider, emailDelivered, processingMs,
  createdAt, updatedAt
}
```

MongoDB is **optional** — the app continues without it if `MONGO_URI` is unset.

---

## 📡 API Reference

### `POST /api/upload`

| Field | Type | Description |
|---|---|---|
| `file` | File | `.csv` or `.xlsx` |
| `recipientEmail` | string | Destination address |

**Response:**
```json
{
  "success": true,
  "message": "Summary generated and sent to exec@company.com",
  "recipient": "exec@company.com",
  "summaryPreview": "Q1 2026 revenue reached $683,000...",
  "rowsAnalyzed": 6,
  "columnsDetected": ["Date","Product_Category","Region","Revenue"],
  "reportId": "64f1abc123"
}
```

**Live docs:** `GET /api/docs` (Swagger UI)

---

## 🔄 CI/CD — GitHub Actions

Triggers on PRs to `main` and pushes to `main`.

| Job | Steps |
|---|---|
| **Backend** | Node 20 → npm ci → ESLint → Jest tests |
| **Frontend** | Node 20 → npm ci → ESLint → Vite build → artifact upload |
| **Docker** | Buildx → backend image → frontend image → compose config validation |

---

## 🌐 Deployment

### Backend → Render
1. New Web Service → root dir: `backend/`
2. Build: `npm install` · Start: `node src/server.js`
3. Add env vars from `.env` (use MongoDB Atlas URI for `MONGO_URI`)

### Frontend → Vercel
1. Import repo → root dir: `frontend/` → Framework: **Vite**
2. Build: `npm run build` · Output: `dist`
3. Env var: `VITE_API_URL=https://your-render-app.onrender.com`

---

## 🧪 Testing

```bash
# With sample data
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sales_q1_2026.csv" \
  -F "recipientEmail=you@example.com"

# Unit tests
cd backend && npm test
```

---

## 📄 License

MIT © Rabbitt AI Engineering Team
