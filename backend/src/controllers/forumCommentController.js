import { error } from "node:console";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { buildCommentTree } from "../utils/comments.js"
import { io } from "../config/socket.js";

// Get all comments for a post
export const listComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ post: id })
      .populate("author", "fullName profileImageUrl role")
      .sort({ createdAt: 1 });

    const nestedComments = buildCommentTree(comments);
    res.json({ ...Post.toObject(), comments: nestedComments });
  } catch (err) {
    next(err);
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // postId
    const { content, parentComment = null } = req.body;
    const author = req.user._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!content?.trim())
      return res.status(400).json({ error: "Comment cannot be empty" });

    const comment = await Comment.create({
      post: id,
      author,
      content: content.trim(),
      parentComment,
    });

    // 🔹 Add comment ID to post's comments array
    await Post.findByIdAndUpdate(id, { $push: { comments: comment._id } });

    // Populate for frontend
    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "fullName profileImageUrl")
      .lean();

    // Emit to post room
    if (req.io) {
      req.io.to(id).emit("comment:new", populatedComment);
    }

    res.status(201).json({
      message: "Comment added",
      comment: populatedComment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to add comment" });
  }
};



// Update own comment
export const updateComment = async (req, res) => {
  try {
    console.log("Request", req.params)
    const { commentId } = req.params;
    const { content } = req.body;

    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const authorId = comment.author.toString();

    if (authorId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only update your own comments" });
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("author", "fullName profileImageUrl")
      .lean();

    if(req.io) {
      req.io.to(updatedComment.post.toString()).emit("comment:updated", updatedComment);
    }

    res.json({ message: "Comment updated successfully", comment: updatedComment });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to update comment" });
  }
};

// Delete a comment (owner only or admin)
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    // Optional: check if post exists
    const post = await Post.findById(id).populate("sub");
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find comment by its own collection
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check Permissions
    const isAuthor = comment.author.equals(userId);
    const isAdmin = req.user.role === "admin";
    const isOwner = post.sub.createdBy.equals(userId);
    const isMod = post.sub.moderators.some(
      (m) =>
        m.user.equals(userId) &&
        (m.role === "mod" || m.role === "sub_mod")
    );

    if (
      !isAuthor &&
      !isAdmin &&
      !isOwner &&
      !isMod
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    //Update post to remove reference to deleted comment
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });

    if(req.io) {
      req.io.to(id).emit("comment:deleted", commentId);
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("❌ Error in Delete comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};



