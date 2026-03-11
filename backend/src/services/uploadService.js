const Papa = require("papaparse");
const XLSX = require("xlsx");
const { generateSalesSummary } = require("./aiService");
const { sendSummaryEmail } = require("./emailService");
const Report = require("../config/Report");
const logger = require("../config/logger");
const mongoose = require("mongoose");

// ── Email validation ─────────────────────────────────────────────────────────
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// ── File parser ───────────────────────────────────────────────────────────────
const parseFile = (buffer, originalname) => {
  const ext = originalname.split(".").pop().toLowerCase();

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) {
      throw new Error(`CSV parse error: ${result.errors[0].message}`);
    }
    return result.data;
  }

  if (["xlsx", "xls"].includes(ext)) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  throw new Error("Unsupported file type. Use .csv, .xlsx, or .xls");
};

// ── Build analytics context ───────────────────────────────────────────────────
const buildDataContext = (rows, filename) => {
  if (!rows || rows.length === 0) { throw new Error("File contains no data rows."); }
  if (rows.length > 50000) { throw new Error("File exceeds 50,000 row limit."); }

  const columns = Object.keys(rows[0]);
  const lines = [`File: ${filename}`, `Total Records: ${rows.length}`, `Columns: ${columns.join(", ")}`, ""];

  // Numeric columns summary
  const numericCols = columns.filter((col) => {
    const sample = rows.slice(0, 20).map((r) => parseFloat(r[col]));
    return sample.filter((v) => !isNaN(v)).length > sample.length / 2;
  });

  if (numericCols.length) {
    lines.push("=== NUMERIC SUMMARY ===");
    numericCols.forEach((col) => {
      const vals = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const mean = sum / vals.length;
      lines.push(`${col}: min=${min.toFixed(2)}, max=${max.toFixed(2)}, mean=${mean.toFixed(2)}, total=${sum.toFixed(2)}`);
    });
    lines.push("");
  }

  // Categorical columns
  const catCols = columns.filter((c) => !numericCols.includes(c)).slice(0, 5);
  if (catCols.length) {
    lines.push("=== CATEGORICAL BREAKDOWN ===");
    catCols.forEach((col) => {
      const counts = {};
      rows.forEach((r) => {
        const v = String(r[col]);
        counts[v] = (counts[v] || 0) + 1;
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k, v]) => `${k}:${v}`)
        .join(", ");
      lines.push(`${col}: { ${top} }`);
    });
    lines.push("");
  }

  // Sample rows
  lines.push("=== SAMPLE DATA (first 10 rows) ===");
  lines.push(
    rows
      .slice(0, 10)
      .map((r) => JSON.stringify(r))
      .join("\n")
  );

  return { context: lines.join("\n"), columns, rowCount: rows.length };
};

// ── Controller ────────────────────────────────────────────────────────────────
const uploadAndAnalyze = async (req, res, next) => {
  const startMs = Date.now();

  try {
    // 1. Validate inputs
    const { recipientEmail } = req.body;
    if (!recipientEmail) {
      return res.status(422).json({ success: false, message: "recipientEmail is required." });
    }
    if (!validateEmail(recipientEmail)) {
      return res.status(422).json({ success: false, message: "Invalid email address format." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const email = recipientEmail.toLowerCase().trim();

    // 2. Parse file
    logger.info(`Parsing file: ${req.file.originalname} (${req.file.size} bytes)`);
    const rows = parseFile(req.file.buffer, req.file.originalname);
    const { context, columns, rowCount } = buildDataContext(rows, req.file.originalname);

    // 3. Generate AI summary
    logger.info(`Generating AI summary for ${rowCount} rows...`);
    const { summary, provider } = await generateSalesSummary(context, req.file.originalname);

    // 4. Send email (non-fatal — log and continue if SMTP fails)
    logger.info(`Sending email to ${email}...`);
    let emailSent = false;
    try {
      emailSent = await sendSummaryEmail({
        recipient: email,
        summary,
        filename: req.file.originalname,
        rowCount,
      });
    } catch (emailErr) {
      logger.warn(`Email delivery failed (non-fatal): ${emailErr.message}`);
    }

    // 5. Persist to MongoDB (non-fatal if DB is unavailable)
    let reportId = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const report = await Report.create({
          filename: req.file.originalname,
          recipientEmail: email,
          rowsAnalyzed: rowCount,
          columnsDetected: columns,
          summaryPreview: summary.slice(0, 500),
          aiProvider: provider,
          emailDelivered: emailSent,
          processingMs: Date.now() - startMs,
        });
        reportId = report._id;
      } catch (dbErr) {
        logger.warn(`DB save failed (non-fatal): ${dbErr.message}`);
      }
    }

    logger.info(`✅ Completed in ${Date.now() - startMs}ms`);

    return res.json({
      success: true,
      message: emailSent
        ? `Summary generated and sent to ${email}`
        : `Summary generated (email delivery failed — check SMTP config)`,
      recipient: email,
      summaryPreview: summary.slice(0, 500) + (summary.length > 500 ? "..." : ""),
      rowsAnalyzed: rowCount,
      columnsDetected: columns,
      emailDelivered: emailSent,
      reportId,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAndAnalyze };
