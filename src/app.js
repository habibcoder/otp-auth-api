const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

/**
 * Create and configure the Express application.
 * @returns {import('express').Express} Configured Express app
 */
function createApp() {
  const app = express();

  // Middleware configuration
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use("/api", authRoutes);

  // 404 handler - route not found
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  });

  // Global error handler - unhandled errors
  app.use((err, _req, res, _next) => {
    console.error("[Unhandled error]", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  });

  return app;
}

module.exports = createApp();
