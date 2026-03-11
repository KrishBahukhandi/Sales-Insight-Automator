const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const uploadRoutes = require("./routes/upload");
const healthRoutes = require("./routes/health");
const { globalErrorHandler } = require("./middleware/errorHandler");
const logger = require("./config/logger");

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
// Helmet sets secure HTTP headers (XSS, clickjacking, MIME sniffing, CSP etc.)
app.use(helmet());

// CORS — restrict to frontend origin in production
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
  })
);

// Sanitize MongoDB operators from user input (NoSQL injection protection)
app.use(mongoSanitize());

// Strip XSS payloads from req.body / req.query
app.use(xssClean());

// Prevent HTTP parameter pollution
app.use(hpp());

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} — ${req.ip}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", uploadRoutes);
app.use("/api", healthRoutes);

// ── Swagger Docs ─────────────────────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Sales Insight Automator — API Docs",
    customCss: `
      .swagger-ui .topbar { background: #0a0a0f; }
      .swagger-ui .topbar-wrapper img { content: none; }
    `,
  })
);
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
