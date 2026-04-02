const { Router } = require("express");
const { normalizePhone, generateOTP } = require("../utils/phone");
const { sendOTP } = require("../services/sms");
const otpService = require("../services/otp");
const userService = require("../services/user");
const { OTP, BRAND_NAME } = require("../config/env");

const router = Router();

/**
 * In-memory token blocklist for logout.
 * Replace with Redis/database in production.
 * @type {Set<string>}
 */
const revokedTokens = new Set();

/**
 * Extract and validate Bearer token from authorization header.
 * @private
 * @param {string} authHeader - Authorization header value
 * @returns {{phone: string, token: string} | null} Parsed token data or null if invalid
 */
function parseToken(authHeader) {
  try {
    const token = (authHeader ?? "").replace("Bearer ", "").trim();
    
    if (!token || revokedTokens.has(token)) {
      return null;
    }
    
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const phone = decoded.split(":")[0];
    
    return { phone, token };
  } catch {
    return null;
  }
}

/**
 * Authentication middleware - validates Bearer token and attaches user to request.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const parsed = parseToken(req.headers.authorization);

  if (!parsed) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required.",
    });
  }

  const user = userService.get(parsed.phone);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Attach authenticated user data to request
  req.user = {
    phone: parsed.phone,
    token: parsed.token,
  };
  
  next();
}

/**
 * POST /api/send-otp
 * Sends a 6-digit OTP to the given Bangladeshi phone number.
 * 
 * Request Body: { phone: string }
 * Returns: { success, isNewUser, message }
 */
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  // Validate phone number presence
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required.",
    });
  }

  // Normalize and validate phone format
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(phone);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Check resend cooldown
  if (otpService.isFresh(normalizedPhone)) {
    return res.status(429).json({
      success: false,
      message: "Please wait 60 seconds before requesting a new OTP.",
    });
  }

  // Generate and send OTP
  const otp = generateOTP();
  const result = await sendOTP(normalizedPhone, otp);

  if (!result.success) {
    return res.status(502).json({
      success: false,
      message: result.error,
    });
  }

  // Store OTP for verification
  otpService.set(normalizedPhone, otp);

  return res.json({
    success: true,
    isNewUser: !userService.exists(normalizedPhone),
    message: result.dev ? `[DEV] OTP: ${otp}` : "OTP sent successfully.",
  });
});

/**
 * POST /api/verify-otp
 * Verifies the OTP and returns a session token on success.
 * 
 * Request Body: { phone: string, otp: string }
 * Returns: { success, isNewUser, token, phone, user, message }
 */
router.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: "Phone and OTP are required.",
    });
  }

  // Normalize phone number
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(phone);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Check if OTP exists
  if (!otpService.get(normalizedPhone)) {
    return res.status(400).json({
      success: false,
      message: "No OTP found for this number. Please request one first.",
    });
  }

  // Check expiry
  if (otpService.isExpired(normalizedPhone)) {
    otpService.remove(normalizedPhone);
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new one.",
    });
  }

  // Check lockout
  if (otpService.isLocked(normalizedPhone)) {
    otpService.remove(normalizedPhone);
    return res.status(429).json({
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    });
  }

  // Increment attempt counter
  otpService.incrementAttempts(normalizedPhone);

  // Verify OTP
  const record = otpService.get(normalizedPhone);
  if (record.otp !== otp.trim()) {
    const remaining = OTP.MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    });
  }

  // Clear OTP after successful verification
  otpService.remove(normalizedPhone);

  // Create or update user
  const isNew = !userService.exists(normalizedPhone);
  const user = userService.upsert(normalizedPhone);

  // Generate session token
  const token = Buffer.from(`${normalizedPhone}:${Date.now()}`).toString("base64");

  return res.json({
    success: true,
    isNewUser: isNew,
    token,
    phone: normalizedPhone,
    user,
    message: isNew ? "Account created successfully." : "Logged in successfully.",
  });
});

/**
 * GET /api/users
 * Returns all registered users.
 */
router.get("/users", (req, res) => {
  const users = userService.getAll();
  return res.json({
    success: true,
    count: users.length,
    users,
  });
});

/**
 * GET /api/users/check
 * Returns whether a phone number is already registered.
 * Query: { phone: string }
 */
router.get("/users/check", (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required.",
    });
  }

  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(phone);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const registered = userService.exists(normalizedPhone);
  return res.json({
    success: true,
    phone: normalizedPhone,
    registered,
  });
});

/**
 * GET /api/me
 * Returns the authenticated user's profile.
 * Requires: Authorization: Bearer <token>
 */
router.get("/me", authenticate, (req, res) => {
  return res.json({
    success: true,
    phone: req.user.phone,
    user: userService.get(req.user.phone),
  });
});

/**
 * POST /api/logout
 * Invalidates the current bearer token.
 * Requires: Authorization: Bearer <token>
 */
router.post("/logout", authenticate, (req, res) => {
  revokedTokens.add(req.user.token);
  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

/**
 * DELETE /api/account
 * Deletes the authenticated user's account.
 * Requires: Authorization: Bearer <token>
 */
router.delete("/account", authenticate, (req, res) => {
  const deleted = userService.remove(req.user.phone);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Revoke token after account deletion
  revokedTokens.add(req.user.token);
  
  return res.json({
    success: true,
    message: "Account deleted successfully.",
  });
});

module.exports = router;
