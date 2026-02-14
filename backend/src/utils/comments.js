export const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c._id] = { ...c.toObject(), replies: [] };
  });

  comments.forEach(c => {
    if (c.parentComment) {
      // Only add to replies if parent is a top-level comment
      if (map[c.parentComment]) {
        map[c.parentComment].replies.push(map[c._id]);
      }
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
};
