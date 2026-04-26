import React, { useState, useEffect } from "react";
import {
  ThumbsUp,
  Loader2,
  ThumbsDown,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react";
import avatar from "../../assets/avatar.jpg";
import { Link } from "react-router";
import { votePost, deletePost as deletePostApi } from "../../api/forum";
import { toast } from "react-hot-toast";
import { ASSET_URL } from "../../config/constants";
import { PostSkeleton } from "../../components/forum/PostSkeleton";
import { useTranslation } from "react-i18next";
import ProfileBadge from "../Badge";

const ForumList = ({ posts = [], loading, user, currentTopic, onTogglePin }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [postList, setPostList] = useState(posts);
  const postsPerPage = 10;
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const fallbackLang = "en";

  const DEFAULT_AUTHOR = {
    fullName: t("guest_label"),
    profileImageUrl: avatar,
    _id: null,
  };


  useEffect(() => {
    setPostList(posts);
    setCurrentPage(1);
  }, [posts]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_posts")}
        </p>
      </div>
    );
  }
  const totalPosts = postList.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = Math.min(startIndex + postsPerPage, totalPosts);
  const currentPosts = postList.slice(startIndex, endIndex);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getAvatar = (author) =>
    author?.profileImageUrl ? author?.profileImageUrl : avatar;

  const handleVote = async (postId, voteValue) => {
    if (!user?._id) return toast.error(t("must_login_vote"));

    setPostList((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;

        let upvotes = p.upvotes || [];
        let downvotes = p.downvotes || [];

        upvotes = upvotes.filter((u) => u !== user._id);
        downvotes = downvotes.filter((u) => u !== user._id);

        if (voteValue === 1) upvotes.push(user._id);
        else downvotes.push(user._id);

        return { ...p, upvotes, downvotes };
      })
    );

    try {
      await votePost(postId, voteValue);
    } catch (err) {
      console.error(err);
      toast.error(t("failed_vote"));
      setPostList(posts);
    }
  };

  const handleDeletePost = async (postId) => {
    const backupPosts = [...postList];
    setPostList((prev) => prev.filter((p) => p._id !== postId));

    let undoClicked = false;

    toast(
      (tToast) => (
        <div className="flex items-center gap-3">
          <span>{t("post_deleted")}</span>
          <button
            onClick={() => {
              undoClicked = true;
              setPostList(backupPosts);
              toast.dismiss(tToast.id);
            }}
            className="text-blue-500 underline"
          >
            {t("undo")}
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    setTimeout(async () => {
      if (undoClicked) return;
      try {
        await deletePostApi(postId);
        toast.success(t("post_permanently_deleted"));
      } catch (err) {
        console.error(err);
        setPostList(backupPosts);
        toast.error(t("failed_delete_post"));
      }
    }, 5000);
  };

  const handleSharePost = (post) => {
    const postUrl = `${window.location.origin}/forum/post/${post._id}`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.body,
          url: postUrl,
        })
        .catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success(t("post_link_copied"));
    }
  };

  const pinnedSponsorPost = currentTopic?.isSponsored
    ? {
        _id: `sponsor-${currentTopic._id}`,
        author: {
          fullName: currentTopic.sponsorName?.[currentLang] || currentTopic.sponsorName?.[fallbackLang],
          profileImageUrl: currentTopic.sponsorLogo
            ? currentTopic.sponsorLogo
            : avatar,
          _id: null,
        },
        title: currentTopic.sponsorTitle?.[currentLang] || currentTopic.sponsorTitle?.[fallbackLang],
        body: currentTopic.sponsorMessage?.[currentLang] || currentTopic.sponsorMessage?.[fallbackLang],
        upvotes: [],
        downvotes: [],
        comments: [],
        createdAt: new Date(currentTopic.startDate || Date.now()),
        pinned: true,
      }
    : null;

  const displayedPosts = pinnedSponsorPost
    ? [pinnedSponsorPost, ...currentPosts]
    : currentPosts;

  if (!postList.length && !pinnedSponsorPost) {
    // Show 3 skeletons as placeholder
    return (
      <div className="space-y-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
        <p className="text-center text-gray-500 mt-2">
          {t("no_posts_yet")}
        </p>
      </div>
    );
  }
    
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        {t("showing")} {startIndex + 1} {t("to")} {Math.min(endIndex, totalPosts)} {t("ofto")} {totalPosts} {t("posts")}
      </p>


      {displayedPosts.map((post) => {
        const author = post.author || DEFAULT_AUTHOR;
        const isSponsorPost = typeof post._id === "string" && post._id.startsWith("sponsor-");

        // Role-based permissions
        const isAdmin = user?.role === "admin";
        const isSubOwner = currentTopic?.createdBy?.toString() === user?._id;
        const isMod =
          currentTopic?.moderators?.some(
            (m) => m.user?.toString() === user?._id && m.role === "mod"
          ) ?? false;
        const isAuthor = author._id === user?._id;
        const isSubMod =
          currentTopic?.moderators?.some(
            (m) => m.user?.toString() === user?._id && m.role === "sub_mod"
          ) ?? false;

        const canDelete = !isSponsorPost && (isAdmin || isSubOwner || isMod || isSubMod || isAuthor);
        const canShare = !isSponsorPost;
        const canPin = !isSponsorPost && (isAdmin || isSubOwner || isMod);

        return (
          <div
            key={post._id}
            className={`w-full max-w-full overflow-hidden bg-white shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4 ${
              isSponsorPost ? "border-2 border-yellow-400" : ""
            }`}
          >
            {isSponsorPost ? (
              <img
                src={currentTopic.sponsorLogo}
                alt={currentTopic.sponsorName[currentLang] || "Sponsor"}
                onError={(e) => {
                  e.target.src = avatar;
                }}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <img
                src={getAvatar(author)}
                alt={author?.fullName || t("guest_label")}
                onError={(e) => {
                  e.target.src = avatar;
                }}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}


            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-black">
                  {isSponsorPost ? (
                  <p>
                    {author.fullName}
                    <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs ml-2">
                      {t("sponsored")}
                    </span>
                  </p>
                ) : (
                  <Link
                    to={
                      author.role === "physiotherapist"
                        ? `/profile/pt/${author._id}`
                        : `/profile/member/${author._id}`
                    }
                  >
                    <span className="font-semibold text-black">
                      {author.fullName}{" "}
                      <ProfileBadge role={author.role} showTooltip={false} />
                    </span>
                  </Link>
                )}
                </span>
                {!isSponsorPost && (
                  <span className="text-gray-400 text-sm">
                    {formatDate(post.createdAt)}
                  </span>
                )}
              </div>

              {isSponsorPost ? (
                <a
                  href={`https://${currentTopic.sponsorWebsite}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-bold text-caribbean mb-2 block break-words"
                >
                  {post.title}
                </a>
              ) : (
                <Link
                  to={`/forum/post/${post._id}`}
                  className="text-lg font-bold text-caribbean mb-2 block break-words"
                >
                  {post.title}
                </Link>
              )}

              {post.image?.url && (
                <div className="mt-3 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={post.image.url}
                    alt="Post"
                    className="w-full object-contain max-h-[600px]"
                  />
                </div>
              )}

              <p className="text-gray-700 mt-2 text-sm line-clamp-3 break-words whitespace-pre-wrap break-all">{post.body}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-500">
                <button
                  onClick={() => handleVote(post._id, 1)}
                  className={`flex items-center gap-1 ${
                    user?._id ? "hover:text-green-600" : "cursor-not-allowed opacity-50"
                  }`}
                  disabled={!user?._id || isSponsorPost}
                >
                  <ThumbsUp size={16} /> {post.upvotes?.length || 0}
                </button>

                <button
                  onClick={() => handleVote(post._id, -1)}
                  className={`flex items-center gap-1 ${
                    user?._id ? "hover:text-red-600" : "cursor-not-allowed opacity-50"
                  }`}
                  disabled={!user?._id || isSponsorPost}
                >
                  <ThumbsDown size={16} /> {post.downvotes?.length || 0}
                </button>

                {canPin && (
                  <button
                    onClick={() => onTogglePin(post._id, post.pinned)}
                    className={`px-2 py-1 text-xs rounded ${
                      post.pinned
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-300 text-black hover:bg-gray-400"
                    }`}
                  >
                    {post.pinned ? t("unpin") : t("pin")}
                  </button>
                )}

                <div className="flex items-center gap-1 cursor-pointer">
                  <MessageCircle size={16} /> {post.comments?.length || 0}
                </div>

                {canShare && (
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSharePost(post)}
                  >
                    <Share2 size={16} /> {t("share")}
                  </div>
                )}

                {canDelete && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-500 flex items-center gap-1"
                  >
                    <Trash2 size={16} /> {t("delete")}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-center gap-2 mt-4">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn p-1 border border-caribbean text-caribbean hover:bg-tufts hover:text-white ${
              currentPage === i + 1 ? "btn-active" : ""
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ForumList;
