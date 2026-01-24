import config from "../config/index.js";

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = config.debug
    ? err.message || "Internal Server Error"
    : status === 500
      ? "Internal Server Error"
      : err.message || "Error";
  res.status(status).json({ error: message });
}
