const asyncHandler = require("express-async-handler");
const registerModel = require("../../model/admin/registerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ============================================================
// IN-MEMORY RATE LIMITER — Max 5 login attempts per IP / 15 min
// ============================================================
const loginAttempts = new Map(); // IP -> { count, firstAttempt, lockedUntil }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

const checkRateLimit = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return { allowed: true };

  // If locked out, check if lockout expired
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  // If window expired, reset
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  // If max attempts reached within window, lock out
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, remainingSec: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { allowed: true };
};

const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now, lockedUntil: null });
  } else {
    record.count += 1;
  }
};

const resetAttempts = (ip) => {
  loginAttempts.delete(ip);
};

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > WINDOW_MS * 2) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

// ============================================================
// LOGIN CONTROLLER
// ============================================================
exports.adminUserLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

  // Rate limit check
  const rateCheck = checkRateLimit(clientIP);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Too many login attempts. Try again in ${rateCheck.remainingSec} seconds.`,
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide both email and password.",
    });
  }

  try {
    const user = await registerModel.findAdminUserByEmail(email);

    // Generic error — don't reveal if email exists or not
    if (!user) {
      recordFailedAttempt(clientIP);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      recordFailedAttempt(clientIP);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ✅ Successful login — reset rate limiter
    resetAttempts(clientIP);

    const token = jwt.sign(
      { userId: user.id, email: user.email, userName: user.full_name },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h", // Match frontend session expiry
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      email: user?.email,
      name: user?.full_name,
      role: user?.role,
      permissions: user?.permissions ? JSON.parse(user.permissions) : [],
      accessToken: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      details: error.message,
    });
  }
});
