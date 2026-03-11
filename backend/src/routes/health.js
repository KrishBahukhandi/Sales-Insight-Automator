const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health Check
 *     description: Returns operational status of the API and MongoDB connection.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: sales-insight-automator-api
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 db:
 *                   type: string
 *                   example: connected
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get("/health", (_req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "healthy",
    service: "sales-insight-automator-api",
    version: "1.0.0",
    db: dbState[mongoose.connection.readyState] || "unknown",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API info
 */
router.get("/", (_req, res) => {
  res.json({
    service: "Sales Insight Automator",
    version: "1.0.0",
    docs: "/api/docs",
  });
});

module.exports = router;
