const logger = require("../config/logger");

const globalErrorHandler = (err, req, res, _next) => {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum allowed size is 10MB.",
    });
  }

  // Multer file type rejection
  if (err.message?.includes("Unsupported file type")) {
    return res.status(415).json({ success: false, message: err.message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(422).json({ success: false, message: err.message });
  }

  // Generic
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "An internal server error occurred."
      : err.message,
  });
};

module.exports = { globalErrorHandler };
