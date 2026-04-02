// const { DEV_MODE, ALPHASMS_API_KEY, ALPHASMS_API_URL, BRAND_NAME } = require("../config/env");

// /**
//  * Send an OTP via SMS.
//  * In DEV_MODE the message is printed to console instead of hitting the API.
//  * @param {string} phone  - normalized phone (8801XXXXXXXXX)
//  * @param {string} otp    - 6-digit OTP string
//  * @returns {Promise<{ success: boolean, dev?: boolean, requestId?: string, error?: string }>}
//  */
// async function sendOTP(phone, otp) {
//   const message = `Your ${BRAND_NAME} verification code is ${otp}. Valid for 5 minutes. Do not share it.`;

//   if (DEV_MODE) {
//     console.log(`\n[DEV] SMS → ${phone}: "${message}"\n`);
//     return { success: true, dev: true };
//   }

//   try {
//     // // Old (x-www-form-urlencoded)
//     // const body = new URLSearchParams({ api_key: ALPHASMS_API_KEY, msg: message, to: phone });

//     // const res = await fetch(ALPHASMS_API_URL, {
//     //   method:  "POST",
//     //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     //   body:    body.toString(),
//     // });

//     // new (use json)
//     const res = await fetch(ALPHASMS_API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         api_key: ALPHASMS_API_KEY,
//         msg: message,
//         to: phone,
//       }),
//     });

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     const data = await res.json();

//     if (data && data.error === 0) {
//       return { success: true, requestId: data.data?.request_id ?? null };
//     }

//     console.error("[sms.net.bd]", data);
//     return { success: false, error: data.msg || "SMS provider returned an error." };
//   } catch (err) {
//     console.error("[sms.net.bd] Network error:", err.message);
//     return { success: false, error: "Could not reach SMS provider." };
//   }
// }

// module.exports = { sendOTP };






















const {
  DEV_MODE,
  BRAND_NAME,
  ALPHASMS,
  SENTMYSMS,
  SMS_SERVICE_PROVIDER,
} = require("../config/env");

/**
 * SMS service for sending OTP messages.
 * Supports multiple SMS providers with automatic fallback.
 * In development mode, logs messages to console instead of sending real SMS.
 */

/**
 * Send an OTP via SMS using the configured provider.
 * @param {string} phone - Normalized phone number (8801XXXXXXXXX)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<SMSResult>} Result object with success status and metadata
 */
async function sendOTP(phone, otp) {
  const message = buildOTPMessage(otp);

  if (DEV_MODE) {
    logDevMessage(phone, message);
    return { success: true, dev: true };
  }

  try {
    // Select provider based on configuration
    const provider = SMS_SERVICE_PROVIDER.toLowerCase();
    
    if (provider === "alphasms") {
      return await sendViaAlphaSMS(phone, message);
    } else if (provider === "sentmysms") {
      return await sendViaSendMySMS(phone, message);
    } else {
      throw new Error(`Unknown SMS provider: ${provider}`);
    }
  } catch (error) {
    console.error("[SMS Service] Error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

/**
 * Build OTP message text with brand name.
 * @private
 * @param {string} otp - 6-digit OTP code
 * @returns {string} Formatted message
 */
function buildOTPMessage(otp) {
  return `Your ${BRAND_NAME} verification code is ${otp}. Valid for 5 minutes. Do not share it.`;
}

/**
 * Log OTP message to console in development mode.
 * @private
 * @param {string} phone - Phone number
 * @param {string} message - Message to log
 */
function logDevMessage(phone, message) {
  console.log("\n[DEV] SMS → %s: \"%s\"\n", phone, message);
}

/**
 * Send SMS via AlphaSMS provider.
 * @private
 * @param {string} phone - Normalized phone number
 * @param {string} message - Message text
 * @returns {Promise<SMSResult>} Result object
 */
async function sendViaAlphaSMS(phone, message) {
  const url = ALPHASMS.API_URL;
  const payload = {
    api_key: ALPHASMS.API_KEY,
    msg: message,
    to: phone,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AlphaSMS HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data && data.error === 0) {
    return {
      success: true,
      requestId: data.data?.request_id ?? null,
      provider: "AlphaSMS",
    };
  }

  console.error("[AlphaSMS] Error:", data);
  throw new Error(data.msg || "AlphaSMS returned an error");
}

/**
 * Send SMS via SendMySMS provider.
 * @private
 * @param {string} phone - Normalized phone number
 * @param {string} message - Message text
 * @returns {Promise<SMSResult>} Result object
 */
async function sendViaSendMySMS(phone, message) {
  const params = new URLSearchParams({
    user: SENTMYSMS.USER,
    key: SENTMYSMS.API_KEY,
    to: phone,
    msg: message,
  });

  const url = `${SENTMYSMS.API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`SendMySMS HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data?.status === "OK") {
    return {
      success: true,
      provider: "SendMySMS",
    };
  }

  console.error("[SendMySMS] Error:", data);
  throw new Error(data?.response || "SendMySMS returned an error");
}

module.exports = { sendOTP };