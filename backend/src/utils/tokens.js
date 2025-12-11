import crypto from "crypto";

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
