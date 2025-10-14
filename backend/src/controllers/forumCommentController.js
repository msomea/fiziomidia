import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Get all comments for a post
export const listComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate("author", "username email")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

// Add a comment to a post
export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    // Optional: check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

// Delete a comment (owner or admin)
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check if user is owner or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};
