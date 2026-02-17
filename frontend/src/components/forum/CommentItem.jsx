import React, { useState } from "react";
import dayjs from "dayjs";
import avatar from "../../assets/avatar.jpg";
import { useTranslation } from "react-i18next";
import ProfileBadge from "../Badge";

const CommentItem = ({
  comment,
  user,
  post,
  postId,
  sub,
  onReply,
  onEdit,
  onDelete,
  editingId,
  editingContent,
  setEditingContent,
  cancelEdit,
  saveEdit,
  depth = 1
}) => {
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  // 🔹 Check if this is a level 3 comment (depth = 3, cannot reply further)
  const isLevel3 = depth >= 3;
  /* ---------------- Permissions ---------------- */
  const isAuthor = user?._id === comment.author?._id;
  const isEditing = editingId === comment._id;
  const isAdmin = user?.role === "admin";
  const isSubOwner = post?.sub?.createdBy?.toString()  === user?._id;
  const isMod =
    post?.sub?.moderators?.some(
      (m) =>
        m.user?.toString() === user?._id?.toString() &&
        (m.role === "mod" || m.role === "sub_mod")
    );
  
  const canDelete =
  user?._id &&
  (
    isAuthor || isAdmin || isSubOwner || isMod
  );

  const getAvatar = (author) =>
    author?.profileImageUrl ? author?.profileImageUrl : avatar;

  /* ---------------- Reply ---------------- */
  const submitReply = () => {
    if (!replyContent.trim()) return;
    onReply(comment._id, replyContent.trim());
    setReplyContent("");
    setReplying(false);
  };


  return (
    <div className="mt-4">
      <div className="flex gap-3">
        <img
          src={getAvatar(comment.author)}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex flex-wrap justify-between items-center mb-1 gap-y-1">
              {/* Name + Badge */}
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm truncate max-w-[70vw] sm:max-w-none">
                  {comment.author?.fullName || "Guest"}
                </p>
                <ProfileBadge role={comment.author?.role} />
              </div>

              {/* Time */}
              <span className="text-xs text-gray-500">
                {dayjs(comment.createdAt).fromNow()}
              </span>
            </div>

            {/* ---------------- Content / Edit ---------------- */}
            {isEditing ? (
              <>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveEdit(comment._id)}
                    className="text-sm text-caribbean font-medium"
                  >
                    {t("save")}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-sm text-gray-500"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}
          </div>

          {/* ---------------- Actions ---------------- */}
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            {user?._id && !isLevel3 && (
              <button onClick={() => setReplying(!replying)}>{t("reply")}</button>
            )}

            {canDelete && !isEditing && (
              <>
                {isAuthor && <button onClick={() => onEdit(comment)}>{t("edit")}</button>}
                <button
                  onClick={() => onDelete(comment._id)}
                  className="text-red-500"
                >
                  {t("delete")}
                </button>
              </>
            )}
          </div>

          {/* ---------------- Reply Box ---------------- */}
          {replying && (
            <div className="mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply…"
                className="w-full border rounded p-2 text-sm"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={submitReply}
                  className="text-sm text-caribbean font-medium"
                >
                  {t("reply")}
                </button>
                <button
                  onClick={() => setReplying(false)}
                  className="text-sm text-gray-500"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          {/* ---------------- Nested Replies ---------------- */}
          {comment.replies?.length > 0 && (
            <div className="mt-3 ml-2 sm:ml-6 pl-2 sm:pl-4 border-l">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  user={user}
                  sub={sub}
                  post={post}
                  postId={postId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editingId={editingId}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  cancelEdit={cancelEdit}
                  saveEdit={saveEdit}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
