export const getUserForumRole = (sub, userId) => {
  if (!userId) return null;

  if (sub.createdBy.equals(userId)) return "owner";

  const mod = sub.moderators.find(m =>
    m.user.equals(userId)
  );

  return mod ? mod.role : null;
};
