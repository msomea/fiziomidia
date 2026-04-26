// src/components/forum/CommentsSection.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { addComment, addReplyToComment, deleteCommentFromPost, updateComment } from "../../api/forum";
import { useForum } from "../../contexts/ForumContext";
import avatar from "../../assets/avatar.jpg";
import CommentItem from "./CommentItem";
import { useTranslation } from "react-i18next";

const COMMENTS_PER_PAGE = 5;

const CommentsSection = ({ post, user, fetchPost, socket }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [displayedCount, setDisplayedCount] = useState(COMMENTS_PER_PAGE);
  const { t } = useTranslation();
  const { updatePostComments } = useForum();

  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  useEffect(() => {
    if (!socket || !post?.postId) return;
    // For comment events we re-fetch the post so the client always
    // receives the fully nested comment tree (keeps logic simple).
    socket.on("comment:new", () => fetchPost());
    socket.on("comment:updated", () => fetchPost());
    socket.on("comment:deleted", () => fetchPost());

    return () => {
      socket.off("comment:new");
      socket.off("comment:updated");
      socket.off("comment:deleted");
    };
  }, [socket, post?.postId]);

  /* ---------------- Add Comment ---------------- */
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user?._id) return toast.error(t("login_to_comment"));

    try {
      setAdding(true);
      const res = await addComment(post.postId, newComment.trim());

      toast.success(t("comment_added"));
      setNewComment("");
      setDisplayedCount(COMMENTS_PER_PAGE);
      updatePostComments(post.postId, res.comments);
      fetchPost();
    } catch (err) {
      console.error(err);
      toast.error(t("failed_add_comment"));
    } finally {
      setAdding(false);
    }
  };
  /* ----------------------- Reply Comment ----------------------- */
  const handleReply = async (parentId, content) => {
  if (!user?._id) return toast.error(t("login_to_reply"));


  try {
    const res = await addReplyToComment(post.postId, content, parentId);

    updatePostComments(post.postId, res.comments);
    fetchPost();
  } catch (err) {
    console.error(err);
    toast.error(t("failed_post_reply"));

  }
};


  /* ---------------- Delete Comment ---------------- */
  const handleDeleteComment = async (commentId) => {
    const backup = post.comments;
    setComments((prev) => prev.filter((c) => c._id !== commentId));

    let undoClicked = false;

    const toastUndo = toast((tToast) => (
      <div className="flex items-center gap-3">
        <span>{t("comment_deleted")}</span>
        <button
          onClick={() => {
            undoClicked = true;
            setComments(backup);
            toast.dismiss(tToast.id);
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));

    const timeoutId = setTimeout(async () => {
      // Only proceed with delete if undo was not clicked
      if (undoClicked) return;

      try {
        const res = await deleteCommentFromPost(post.postId, commentId);

        setDisplayedCount(COMMENTS_PER_PAGE);
        updatePostComments(post.postId, res.comments);
        fetchPost();
      } catch (err) {
        console.error(err);
        setComments(backup);
        toast.error(t("failed_delete_comment"));

      }
    }, 5000);
  };

  /* ---------------- Edit Comment ---------------- */
  const startEdit = (c) => {
    setEditingId(c._id);
    setEditingContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEdit = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error(t("comment_empty"));
      return;
    }

    try {
      const res = await updateComment(post.postId, commentId, editingContent.trim());

      toast.success(t("comment_updated"));
      cancelEdit();
      updatePostComments(post.postId, res.comments);
      fetchPost();
    } catch (err) {
      console.error(err);
      toast.error(t("failed_update_comment"));
    }
  };

  /* 🔹 Count total comments including nested replies */
  const countAllComments = (comments) => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalCommentCount = countAllComments(comments);

  /* ---------------- Sorting & Pagination ---------------- */
  const topLevelComments = comments.filter((c) => !c.parentComment);

  const sortedComments = [...topLevelComments].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const displayedComments = sortedComments.slice(0, displayedCount);
  const hasMore = displayedCount < sortedComments.length;


  /* ---------------- UI ---------------- */
  return (
    <div className="mt-6 bg-white shadow-sm rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">
          {t("comments")} ({totalCommentCount})
        </h3>

        {post.comments?.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setDisplayedCount(COMMENTS_PER_PAGE);
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">{t("newest_first")}</option>
            <option value="oldest">{t("oldest_first")}</option>

          </select>
        )}
      </div>

      {displayedComments.length ? (
        displayedComments.map((c) => (
          <CommentItem
            key={c._id}
            comment={c}
            user={user}
            post={post}
            postId={post.postId}
            onReply={handleReply}
            onEdit={startEdit}
            onDelete={handleDeleteComment}
            editingId={editingId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
          />
        ))
      ) : (
        <p className="text-gray-500 text-sm">
          {t("no_comments_yet")}
        </p>
      )}


      {hasMore && (
        <button
          onClick={() =>
            setDisplayedCount((prev) => prev + COMMENTS_PER_PAGE)
          }
          className="w-full mt-3 py-2 font-medium hover:bg-gray-100 rounded-lg"
        >
          {t("load_more")} ({displayedCount}/{sortedComments.length})
        </button>
      )}

      <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder={user?._id
            ? t("add_comment_placeholder")
            : t("login_to_comment")
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border rounded-lg p-2"
          disabled={!user?._id}
        />
        <button
          type="submit"
          disabled={adding || !user?._id}
          className="bg-caribbean text-white px-4 py-2 rounded-lg"
        >
          {adding ? t("posting") : t("post")}
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;
