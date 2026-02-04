import jwt from "jsonwebtoken";
import config from "../config/index.js";
import User from "../models/User.js";
import { signAccessToken } from "../services/tokenService.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ error: "Unauthorized" });
}
  const token = authHeader.trim().split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // Verify JWT using access token secret
    const payload = jwt.verify(token, config.jwt.accessSecret);

    // Attach user to request
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = user;
    // Sliding session: if token is close to expiry, issue a refreshed token and
    // return it in the `x-access-token` response header so frontend can update.
    try {
      if (payload && payload.exp) {
        const timeLeftMs = payload.exp * 1000 - Date.now();
        const renewThresholdMs =
          (config.jwt.renewThresholdSeconds || 300) * 1000;
        if (timeLeftMs < renewThresholdMs) {
          const newAccessToken = signAccessToken(user);
          res.setHeader("x-access-token", newAccessToken);
          // Ensure the browser can read this header
          res.setHeader("Access-Control-Expose-Headers", "x-access-token");
        }
      }
    } catch (e) {
      console.warn("Failed to refresh access token:", e);
    }
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
