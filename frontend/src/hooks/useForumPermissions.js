// hooks/useForumPermissions.js
export default function useForumPermissions(sub, currentUser) {
  const userId = currentUser?._id;
  const userRole = currentUser?.role; // admin, physiotherapist, etc.

  const role = (() => {
    if (!userId) return null;
    if (sub.createdBy._id === userId || sub.createdBy === userId) return "owner";

    const mod = sub.moderators?.find(
      (m) => m.user._id === userId || m.user === userId
    );
    return mod ? mod.role : null;
  })();

  return {
    // Owner permissions (minus admin-only tasks)
    isOwner: role === "owner",
    canEditSub: role === "owner" || role === "mod", // edit title/description/rules
    canManageMods: role === "owner" || role === "mod", // approve/reject sub_mod requests
    canModeratePosts: ["owner", "mod", "sub_mod"].includes(role), // delete/hide posts
    canPinPosts: role === "owner" || role === "mod", // optional
    canManageRules: role === "owner" || role === "mod",

    // Admin-only tasks
    canDeleteSub: userRole === "admin",
    canManageSponsorship: userRole === "admin",
  };
}
