// backend/src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/index.js";

const SALT_ROUNDS = 10;

// Helper functions
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role },
    config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id },
    config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

// POST /api/auth/register
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
    });

    await user.save();
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    
    res.status(201).json({
      message: "Registration successful",
      user: { id: user._id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/auth/login
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Set isLoggedIn = true
    user.isLoggedIn = true;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({
      message: "Login successful",
            user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isLoggedIn: user.isLoggedIn,
      },
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// Refresh access token
// POST /api/auth/refresh
export async function refreshToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Refresh token required" });

  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

// logout user
// POST /api/auth/logout
export async function logoutUser(req, res) {
  try {
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { isLoggedIn: false });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// Get current logged-in user
// GET /api/auth/me
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}


