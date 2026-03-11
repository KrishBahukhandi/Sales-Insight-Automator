const express = require("express");
const multer = require("multer");
const { uploadAndAnalyze } = require("../services/uploadService");
const { apiKeyAuth } = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

// Multer — memory storage (no disk writes), 10MB cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ["csv", "xlsx", "xls"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: .csv, .xlsx, .xls`), false);
    }
  },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload Sales Data & Generate AI Summary
 *     description: |
 *       Upload a `.csv` or `.xlsx` file plus a recipient email.
 *       The API will parse the data, generate an AI executive brief via Groq (Llama 3),
 *       send it to the recipient, and return a preview in the response.
 *
 *       **Rate limit:** 10 requests per minute per IP address.
 *
 *       **File constraints:** Max 10MB · Max 50,000 rows · `.csv`, `.xlsx`, `.xls` only
 *     tags: [Upload & Analysis]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, recipientEmail]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Sales data file (.csv or .xlsx)
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address to receive the AI summary
 *     responses:
 *       200:
 *         description: Summary generated and email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Summary generated and sent to exec@company.com
 *                 recipient:
 *                   type: string
 *                   example: exec@company.com
 *                 summaryPreview:
 *                   type: string
 *                   example: Q1 2026 revenue reached $683,000...
 *                 rowsAnalyzed:
 *                   type: integer
 *                   example: 6
 *                 columnsDetected:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Date","Product_Category","Region","Revenue"]
 *                 reportId:
 *                   type: string
 *                   example: 64f1abc123
 *       400:
 *         description: Invalid file content or empty dataset
 *       413:
 *         description: File too large (>10MB)
 *       415:
 *         description: Unsupported file type
 *       422:
 *         description: Validation error (invalid email)
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: AI or email service failure
 */
router.post(
  "/upload",
  rateLimiter,
  apiKeyAuth,
  upload.single("file"),
  uploadAndAnalyze
);

module.exports = router;
