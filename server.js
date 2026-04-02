const app = require("./src/app");
const config = require("./src/config/env");

/**
 * Start the HTTP server with configuration validation.
 */
function startServer() {
  try {
    // Validate environment configuration
    config.validateConfig();

    const server = app.listen(config.PORT, () => {
      printStartupInfo();
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      console.log("\nSIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Process terminated.");
        process.exit(0);
      });
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

/**
 * Print startup information to console.
 */
function printStartupInfo() {
  console.log("\n" + "=".repeat(50));
  console.log(" Server started successfully");
  console.log("=".repeat(50));
  console.log(` URL     : http://localhost:${config.PORT}`);
  console.log(` Brand   : ${config.BRAND_NAME}`);
  console.log(` Mode    : ${config.DEV_MODE ? "DEVELOPMENT" : "PRODUCTION"}`);
  
  if (config.DEV_MODE) {
    console.log(" Note    : OTPs logged to console (no real SMS)");
  } else {
    console.log(` Provider: ${config.SMS_SERVICE_PROVIDER}`);
    
    // Mask sensitive credentials for display
    if (config.SMS_SERVICE_PROVIDER === "ALPHASMS") {
      const keyMasked = config.ALPHASMS.API_KEY 
        ? `${config.ALPHASMS.API_KEY.slice(0, 3)}...` 
        : "NOT SET";
      console.log(` API Key : ${keyMasked}`);
    } else if (config.SMS_SERVICE_PROVIDER === "SENTMYSMS") {
      const userMasked = config.SENTMYSMS.USER 
        ? `${config.SENTMYSMS.USER.slice(0, 3)}...` 
        : "NOT SET";
      const keyMasked = config.SENTMYSMS.API_KEY 
        ? `${config.SENTMYSMS.API_KEY.slice(0, 3)}...` 
        : "NOT SET";
      console.log(` User    : ${userMasked}`);
      console.log(` API Key : ${keyMasked}`);
    }
  }
  
  console.log("=".repeat(50) + "\n");
}

// Start the server
startServer();
