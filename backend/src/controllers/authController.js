import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendEmail } from "../services/sendEmailService.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService.js";
import { generateRandomToken } from "../utils/tokens.js";
import { generateFiziomidiaEmail } from "../templates/emailHelper.js";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL = 10 * 60 * 1000; // 10 minutes
const VERIFY_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Helper to standardize API responses
 */
function success(res, message, data = {}) {
  return res.json({ success: true, message, ...data });
}
function fail(res, status = 400, error = "Bad request") {
  return res.status(status).json({ success: false, error });
}

/**
 * @route POST /api/auth/register
 * @desc Register a new user and send verification email
 * @access Public
 */
export async function registerUser(req, res) {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName) {
      return fail(res, 400, "Name, email and password required");
    }

    const existing = await User.findOne({ email });
    if (existing) return fail(res, 409, "Email already in use");

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // create verification token
    const verifyToken = generateRandomToken();
    const verifyTokenExpire = Date.now() + VERIFY_TOKEN_TTL;

    const user = new User({
      email,
      fullName,
      passwordHash,
      role: role || "member",
      isLoggedIn: false,
      isVerified: false,
      isActive: true,
      refreshTokens: [],
      verifyToken,
      verifyTokenExpire,
    });

    // Create verification url
    const verifyURL = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    //Remove on Production
    console.log("✅ ✅ ✅ Click to verify email", verifyURL)
    // Save user once
    await user.save();

    // Send verify email (fire and forget pattern is OK but await for reliability)
    const verifyHTML = generateFiziomidiaEmail({
      title: "Verify Your Email",
      body: "<p>Hello! Please verify your FizioMidia account by clicking the button below. This link expires in 1 hour.</p>",
      buttonText: "Verify Email",
      buttonURL: verifyURL
    });

    await sendEmail({
      to: email,
      subject: "Verify your FizioMidia account",
      html: verifyHTML
    });

    return success(res, "Registration successful. Please verify your email.");
  } catch (err) {
    console.error("Register error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify a user's email
 * @access Public
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    if (!token) return fail(res, 400, "Token required");

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpire: { $gt: Date.now() },
    });

    if (!user) return fail(res, 400, "Invalid or expired token");

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    await user.save();

    return success(res, "Email verified successfully");
  } catch (err) {
    console.error("Verify email error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email (do not reveal whether email exists)
 * @access Public
 */
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) return fail(res, 400, "Email required");

    const user = await User.findOne({ email });
    // Always return success message to avoid revealing account existence
    if (!user) return success(res, "Password reset link sent (if email exists)");

    // Simple throttle: if a valid token already exists and not expired, ask to wait
    if (user.resetToken && user.resetTokenExpire && user.resetTokenExpire > Date.now() - 2 * 60 * 1000) {
      // if a token was created less than 2 minutes ago, refuse to spam
      return success(res, "Password reset link sent (if email exists)");
    }

    const token = generateRandomToken();
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + RESET_TOKEN_TTL;
    await user.save();
    
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
    // Send Email
    const resetHTML = generateFiziomidiaEmail({
      title: "Reset Your Password",
      body: "<p>We received a request to reset your password. Click the button below to reset it. This link expires in 10 minutes.</p>",
      buttonText: "Reset Password",
      buttonURL: resetURL
    });

    await sendEmail({
      to: email,
      subject: "Reset your Fiziomidia password",
      html: resetHTML
    });
    //Remove on Production
    console.log("✅ ✅ ✅ Click to reset your Password", resetURL)
    return success(res, "Password reset link sent (if email exists)");
  } catch (err) {
    console.error("Request password reset error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password, clear sessions
 * @access Public
 */
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!token || !newPassword) return fail(res, 400, "Token and new password required");

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) return fail(res, 400, "Invalid or expired token");

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = hashed;

    // Remove reset token and revoke refresh tokens (force logout everywhere)
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    user.refreshTokens = [];
    await user.save();

    // Notify user of password change
    await sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      html: `<p>Your password was changed. If you did not perform this action, please contact support and reset again immediately.</p>`,
    });

    return success(res, "Password reset successfully");
  } catch (err) {
    console.error("Reset password error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route POST /api/auth/login
 * @desc Login user, return access + refresh tokens (refresh token rotation)
 * @access Public
 */
export async function loginUser(req, res) {
  try {
    const { email, password, deviceName } = req.body;
    if (!email || !password) return fail(res, 400, "Email and password required");

    const user = await User.findOne({ email });
    if (!user) return fail(res, 401, "Invalid credentials");

    // blocked / inactive checks
    if (!user.isActive) return fail(res, 403, "Account disabled");
    if (user.isBanned) return fail(res, 403, "Account banned");
    if (!user.isVerified) return fail(res, 403, "Please verify your email before logging in");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return fail(res, 401, "Invalid credentials");

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // refresh token rotation/per-device: store device metadata (optional)
    const tokenEntry = {
      token: refreshToken,
      createdAt: new Date(),
      device: deviceName || req.headers["user-agent"] || "unknown",
    };

    // Option A: Allow one refresh token per device (nice), but here we'll append and limit number
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(tokenEntry);

    // Keep only last N refresh tokens to avoid unlimited growth
    const MAX_REFRESH_TOKENS = 10;
    if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
    }

    user.isLoggedIn = true;
    await user.save();

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isLoggedIn: user.isLoggedIn,
        profileImageUrl: user.profileImageUrl || "",
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route POST /api/auth/refresh
 * @desc Rotate refresh token and return new access (and rotate refresh token)
 * @access Public
 */
export async function refreshToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) return fail(res, 401, "Refresh token required");

    // Find user who has this refresh token
    const user = await User.findOne({ "refreshTokens.token": token });
    if (!user) return fail(res, 403, "Invalid refresh token");

    // Verify token signature/expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (e) {
      // Token invalid; remove it if present
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
      await user.save();
      return fail(res, 403, "Invalid or expired refresh token");
    }

    // Rotate: remove the used refresh token and issue a new one
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);

    const newRefreshToken = signRefreshToken(user);
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      device: "rotated",
    });

    await user.save();

    const newAccessToken = signAccessToken(user);

    return res.json({
      success: true,
      message: "Token refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route POST /api/auth/logout
 * @desc Logout user and remove refresh token
 * @access Private
 */
export async function logoutUser(req, res) {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    if (!token) {
      // If client doesn't send token, we can just set isLoggedIn = false
      await User.findByIdAndUpdate(userId, { isLoggedIn: false });
      return success(res, "Logged out successfully");
    }

    await User.findByIdAndUpdate(userId, {
      isLoggedIn: false,
      $pull: { refreshTokens: { token } },
    });

    // Emit socket event if present
    try {
      const io = req.app?.get("io");
      if (io) io.emit("userWentOffline", { userId: userId.toString() });
    } catch (e) {
      console.error("Error emitting logout socket event:", e);
    }

    return success(res, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    return fail(res, 500, "Server error");
  }
}

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-passwordHash -refreshTokens");
    if (!user) return fail(res, 404, "User not found");
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Get current user error:", err);
    return fail(res, 500, "Server error");
  }
}
