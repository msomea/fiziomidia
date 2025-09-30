import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // add .js
import config from "../config/index.js"; // ensure config has index.js

const SALT_ROUNDS = 10;

function signAccessToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export async function register(req, res) {
  const { email, password, fullName, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    email,
    passwordHash,
    fullName,
    role: role || "member",
  });

  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({
    user: { id: user._id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.json({
    user: { id: user._id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Refresh token required" });

  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}
