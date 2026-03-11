const apiKeyAuth = (req, res, next) => {
  const configured = process.env.API_KEY;

  // If no key is configured, skip auth (open-access / dev mode)
  if (!configured) { return next(); }

  const provided = req.headers["x-api-key"];
  if (!provided || provided !== configured) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or missing API key. Include header: X-API-Key: <your-key>",
    });
  }

  next();
};

module.exports = { apiKeyAuth };
