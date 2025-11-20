import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Get all comments for a post
export const listComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id })
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
    const { id } = req.params;
    const { content } = req.body;
    const author = req.user._id;
    // Optional: check if post exists
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: id,
      author,
      content,
    });

    await Post.findByIdAndUpdate(id, { $push: { comments: comment._id } });

    res.status(201).json({comment});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to add comment" });
  }
};

// Update own comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (!comment.author._id.equals(userId)) {
      return res.status(403).json({ error: "You can only update your own comments" });
    }

    comment.content = content;
    await comment.save();

    res.json({ message: "Comment updated successfully", comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to update comment" });
  }
};


// Delete a comment (owner only or admin)
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // id = postId, commentId = comment._id

    // Optional: check if post exists
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find comment by its own collection
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check ownership
    if (comment.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    //Update post to remove reference to deleted comment
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("❌ Error in Delete comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};



