import jwt from "jsonwebtoken";
import config from "../config/index.js";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.trim().split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // Verify JWT using access token secret
    const payload = jwt.verify(token, config.jwt.accessSecret);

    // Attach user to request
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authenticateOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.trim().split(" ")[1];

  if (!token) return next(); // anonymous user allowed

  try {
    const payload = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (user) req.user = user;
  } catch (err) {
    // ignore invalid token, treat as anonymous
  }
  next();
};

export const authenticateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};
