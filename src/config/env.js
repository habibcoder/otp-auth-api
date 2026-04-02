require("dotenv").config();

/**
 * Environment configuration with validation and defaults.
 * Centralized configuration management for the application.
 */
const config = {
  /** Server port */
  PORT: parseInt(process.env.PORT, 10) || 3000,
  
  /** Development mode flag - enables console logging for OTPs */
  DEV_MODE: process.env.DEV_MODE !== "false",
  
  /** SMS service provider selection */
  SMS_SERVICE_PROVIDER: process.env.SMS_SERVICE_PROVIDER || "ALPHASMS",
  
  /** Application/brand name displayed in SMS messages */
  BRAND_NAME: process.env.BRAND_NAME || "My App",
  
  /** OTP configuration */
  OTP: {
    EXPIRY_MS: 5 * 60 * 1000,      // 5 minutes validity
    RESEND_COOLDOWN_MS: 60 * 1000, // 60 seconds between resends
    MAX_ATTEMPTS: 5,               // Maximum verification attempts
  },
  
  /** AlphaSMS provider configuration */
  ALPHASMS: {
    API_URL: process.env.ALPHASMS_API_URL || "https://api.sms.net.bd/sendsms",
    API_KEY: process.env.ALPHASMS_API_KEY || "",
  },
  
  /** SendMySMS provider configuration */
  SENTMYSMS: {
    API_URL: process.env.SENTMYSMS_API_URL || "https://sendmysms.net/api.php",
    USER: process.env.SENTMYSMS_USER || "",
    API_KEY: process.env.SENTMYSMS_API_KEY || "",
  },
};

/**
 * Validate critical environment variables.
 * Throws error if required production configuration is missing.
 */
function validateConfig() {
  if (!config.DEV_MODE && !config.ALPHASMS.API_KEY && !config.SENTMYSMS.API_KEY) {
    throw new Error(
      "SMS provider API key is required in production. " +
      "Set ALPHASMS_API_KEY or SENTMYSMS_API_KEY in environment variables."
    );
  }
  return config;
}

module.exports = { ...validateConfig(), validateConfig };
