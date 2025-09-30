export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (!allowedRoles.includes(user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
