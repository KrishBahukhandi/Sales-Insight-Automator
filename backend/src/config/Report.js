const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    recipientEmail: { type: String, required: true, lowercase: true },
    rowsAnalyzed: { type: Number, required: true },
    columnsDetected: [String],
    summaryPreview: { type: String },
    aiProvider: {
      type: String,
      enum: ["groq", "gemini", "openai", "fallback"],
      default: "groq",
    },
    emailDelivered: { type: Boolean, default: false },
    processingMs: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
