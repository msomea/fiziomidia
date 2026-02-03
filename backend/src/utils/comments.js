export const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c._id] = { ...c.toObject(), replies: [] };
  });

  comments.forEach(c => {
    if (c.parentComment) {
      map[c.parentComment]?.replies.push(map[c._id]);
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
};
