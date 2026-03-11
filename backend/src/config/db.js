const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.warn("MONGO_URI not set — skipping MongoDB connection (report storage disabled)");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("✅ MongoDB connected");
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    // Non-fatal — app continues without DB (email/AI still works)
  }
};

module.exports = connectDB;
