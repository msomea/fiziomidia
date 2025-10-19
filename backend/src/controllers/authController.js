import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/index.js";

const SALT_ROUNDS = 10;

// 🔹 Utility: Sign access token
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );
}

// 🔹 Utility: Sign refresh token
function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

// ---------------------------
// POST /api/auth/register
// ---------------------------
export async function registerUser(req, res) {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Name, email and password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      email,
      fullName,
      passwordHash,
      role: role || "member",
      isLoggedIn: false,
      refreshTokens: [],
    });

    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Save refresh token in DB
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl || "",
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ---------------------------
// POST /api/auth/login
// ---------------------------
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken });
    user.isLoggedIn = true;
    await user.save();

    res.json({
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
    res.status(500).json({ error: "Server error" });
  }
}

// ---------------------------
// POST /api/auth/refresh
// ---------------------------
export async function refreshToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "Refresh token required" });

    const user = await User.findOne({ "refreshTokens.token": token });
    if (!user) return res.status(403).json({ error: "Invalid refresh token" });

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch (err) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = signAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(403).json({ error: "Failed to refresh token" });
  }
}

// ---------------------------
// POST /api/auth/logout
// ---------------------------
export async function logoutUser(req, res) {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    await User.findByIdAndUpdate(userId, {
      isLoggedIn: false,
      $pull: { refreshTokens: { token } },
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ---------------------------
// GET /api/auth/me
// ---------------------------
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-passwordHash -refreshTokens");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
