import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import escapeRegExp from "../utils/escapeRegExp.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/uploadService.js";


// ===== SUBS =====
// List all forum subs with pagination and totalPosts dynamically calculated
export const listSubs = async (req, res) => {
  try {
    
    const search = req.query.search || "";
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // limit max to 100
    const skip = (page - 1) * limit;

    // Build search filter
    const match = search
      ? {
          $or: [
            { title: { $regex: escapeRegExp(search), $options: "i" } },
            { slug: { $regex: escapeRegExp(search), $options: "i" } },
            { description: { $regex: escapeRegExp(search), $options: "i" } },
          ],
        }
      : {};

    // Fetch paginated subs
    const subs = await ForumSub.find(match)
      .sort({ createdAt: -1, _id: -1 }) // stable sort
      .skip(skip)
      .limit(limit)
      .select(
        "title slug description totalPosts isSponsored sponsorName sponsorLogo sponsorWebsite sponsorTitle startDate endDate createdAt"
      ); // only select needed fields

    // Total count for pagination
    const totalCount = await ForumSub.countDocuments(match);

    res.json({
      subs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching forum subs:", err);
    res.status(500).json({ error: "Failed to fetch subs" });
  }
};

// Get single sub
// GET /subs/:id
export const getSubById= async (req, res) => {
  try {
    const { id } = req.params;

    // fetch sub with moderators
    const sub = await ForumSub.findById(id)
      .populate("createdBy", "fullName email role")
      .populate("moderators.user", "fullName email role");

    if (!sub) return res.status(404).json({ message: "Sub not found" });

    // 🔹 Determine role of current logged-in user
    let myRole = null; 
    if (req.user) {
      if (sub.createdBy._id.equals(req.user._id)) myRole = "owner";
      else {
        const mod = sub.moderators.find((m) =>
          m.user._id.equals(req.user._id)
        );
        myRole = mod ? mod.role : null;
      }
    }

    // respond with sub + myRole
    return res.json({
      success: true,
      sub: {
        _id: sub._id,
        title: sub.title,
        slug: sub.slug,
        description: sub.description,
        rules: sub.rules,
        moderators: sub.moderators,
        createdBy: sub.createdBy,
        isSponsored: sub.isSponsored,
        sponsorTitle: sub.sponsorTitle,
        sponsorName: sub.sponsorName,
        sponsorLogo: sub.sponsorLogo,
        sponsorMessage: sub.sponsorMessage,
        sponsorWebsite: sub.sponsorWebsite,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,

        myRole, // 🔹 THIS IS THE INJECTION
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Create a new sub (PTs or Admin only)
export const createSub = async (req, res) => {
  if (req.user.role !== "physiotherapist" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only verified PTs or admin can create subs" });
  }

  const { title, slug, description, rules } = req.body;

  // ✅ Validation: ensure both EN and SW are provided
  if (
    !title?.en ||
    !title?.sw ||
    !description?.en ||
    !description?.sw ||
    !Array.isArray(rules) ||
    rules.some((r) => !r.en || !r.sw)
  ) {
    return res.status(400).json({
      error: "Title, description, and all rules must have both EN and SW versions",
    });
  }

  try {
    const sub = new ForumSub({
      title,        // { en, sw }
      slug,
      description,  // { en, sw }
      createdBy: req.user._id,
      rules,        // [{ en, sw }]
    });

    await sub.save();
    res.status(201).json({ sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create sub" });
  }
};

// Edit Sub (Admin, Mod, Sub Owner only)
export const editSub = async (req, res) => {
  const { subId } = req.params;
  const { title, description, rules, slug } = req.body;

  try {
    const sub = await ForumSub.findById(subId);

    if (!sub) {
      return res.status(404).json({ error: "Sub not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = sub.createdBy.toString() === req.user._id.toString();
    const isMod =
      sub.moderators?.some(
        (m) => m.user.toString() === req.user._id.toString() && m.role === "mod"
      );

    if (!isAdmin && !isOwner && !isMod) {
      return res
        .status(403)
        .json({ error: "You are not allowed to edit this sub" });
    }

    // ✅ Validation: both EN and SW required
    if (title && (!title.en || !title.sw)) {
      return res.status(400).json({ error: "Title must have both EN and SW" });
    }
    if (description && (!description.en || !description.sw)) {
      return res
        .status(400)
        .json({ error: "Description must have both EN and SW" });
    }
    if (rules && rules.some((r) => !r.en || !r.sw)) {
      return res
        .status(400)
        .json({ error: "All rules must have both EN and SW" });
    }

    // Update allowed fields
    if (title !== undefined) sub.title = title;
    if (description !== undefined) sub.description = description;
    if (rules !== undefined) sub.rules = rules;
    if (slug !== undefined && isAdmin) sub.slug = slug; // admin-only for slug

    await sub.save();

    res.json({
      success: true,
      sub,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update sub" });
  }
};

export const getMySubs = async (req, res) => {
  try {
    const subs = await ForumSub.find({ createdBy: req.user._id });
    res.json({ success: true, subs });
  } catch (err) {
    console.error("Failed to fetch subs:", err);
    res.status(500).json({ success: false, error: "Failed to fetch subs" });
  }
};

// Update mod request role by sub owner
export const updateModRequestRoleByOwner = async (req, res) => {
  try {
    const { subId, requestId } = req.params;
    const { role } = req.body; // "mod" | "sub_mod" | "member"

    if (!["mod", "sub_mod", "member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const sub = await ForumSub.findById(subId);
    if (!sub) return res.status(404).json({ error: "Sub not found" });

    // Only sub owner or admin can change request
    const isOwner = sub.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const request = await ForumSubModRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Update status based on role change
    if (role === "mod" || role === "sub_mod") {
      request.status = "approved";
    } else if (role === "member") {
      request.status = "rejected";
    }

    request.role = role;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    // Update sub moderators array
    let modEntry = sub.moderators.find((m) => m.user.equals(request.user));
    if (role === "mod" || role === "sub_mod") {
      if (!modEntry) {
        sub.moderators.push({ user: request.user, role, assignedAt: new Date() });
      } else {
        modEntry.role = role; // upgrade/downgrade
      }
    } else {
      // role === "member" → remove mod entry
      sub.moderators = sub.moderators.filter((m) => !m.user.equals(request.user));
    }

    await sub.save();
    await request.save();

    res.json({ success: true, sub, request });
  } catch (err) {
    console.error("Failed to update mod request:", err);
    res.status(500).json({ error: "Failed to update mod request" });
  }
};

// ===== POSTS =====

// Create a post under a sub
export const createPost = async (req, res) => {
  try {
    const { title, body, sub } = req.body;
    const author = req.user._id;

    if (!sub) return res.status(400).json({ error: "Sub (topic) is required" });

    // Upload image to cloudinary
    let imageData = null

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      imageData = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    // 1️⃣ Create new post
    const post = new Post({ 
      title,
      body,
      sub,
      author,
      image: imageData });

    await post.save();

    // 2️⃣ Manually increment totalPosts to ensure it's updated immediately
    await ForumSub.findByIdAndUpdate(sub, { $inc: { totalPosts: 1 } });

    // 3️⃣ Fetch updated sub to return with post
    const updatedSub = await ForumSub.findById(sub);

    res.status(201).json({ post, sub: updatedSub });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// List all posts in a sub (public view, paginated)
export const listPosts = async (req, res) => {
  const { subId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const totalPosts = await Post.countDocuments({ sub: subId });
    const posts = await Post.find({ sub: subId })
      .populate("author", "fullName role profileImageUrl")
      .populate("comments", "_id")
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      posts,
      meta: {
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};


// Vote on a post
export const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;
    const userId = req.user._id.toString();

    if (![1, -1].includes(vote)) {
      return res.status(400).json({ error: "Vote must be 1 (upvote) or -1 (downvote)" });
    }

    const post = await Post.findById(id)
      .populate("upvotes", "fullName")
      .populate("downvotes", "fullName");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Remove existing vote if user already voted
    post.upvotes = post.upvotes.filter((u) => u._id.toString() !== userId);
    post.downvotes = post.downvotes.filter((u) => u._id.toString() !== userId);

    // Apply new vote
    if (vote === 1) {
      post.upvotes.push(req.user._id);
    } else {
      post.downvotes.push(req.user._id);
    }

    // Update score (for sorting later)
    post.score = post.upvotes.length - post.downvotes.length;

    await post.save();

    res.json({
      message: "Vote recorded",
      postId: post._id,
      upvotesCount: post.upvotes.length,
      downvotesCount: post.downvotes.length,
      score: post.score,
    });
  } catch (err) {
    console.error("❌ Error voting on post:", err);
    res.status(500).json({ error: "Failed to vote on post" });
  }
};


// Update a post
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, body } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (req.user.role !== "admin" && post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Forbidden" });

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    post.updatedAt = new Date();

    await post.save();
    res.json({ post });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
};

// Get single post (with vote info)
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Post ID is required" });

    const post = await Post.findById(id)
      .populate("author", "fullName role profileImageUrl")
      .populate("comments", "_id")
      .populate({
        path: "sub",
        select: "createdBy moderators",
      })
      .lean();

    if (!post) return res.status(404).json({ error: "Post not found" });

    const comments = await Comment.find({ post: post._id })
      .populate("author", "fullName role profileImageUrl")
      .sort({ createdAt: -1 })
      .lean();

    const upvotesCount = post.upvotes?.length || 0;
    const downvotesCount = post.downvotes?.length || 0;
    const totalScore = upvotesCount - downvotesCount;

    res.json({
      postId: post._id,
      title: post.title,
      body: post.body,
      image: post.image || null, // ✅ ADD THIS
      author: post.author,
      sub: post.sub,
      createdAt: post.createdAt,
      comments,
      upvotesCount,
      downvotesCount,
      totalScore,
    });

  } catch (err) {
    console.error("❌ Error fetching post:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// GET /api/forum?ptId=<id>&limit=3 → returns last 3 posts
// GET /api/forum?ptId=<id> → returns all posts
export const getPTPosts = async (req, res) => {
  try {
    const { ptId, limit } = req.query;

    if (!ptId) return res.status(400).json({ error: "ptId is required" });

    let query =   Post.find({ author: ptId }).sort({ createdAt: -1 });

    if (limit) query = query.limit(parseInt(limit));

    const posts = await query.exec();

    res.json({posts: posts});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch forum posts" });
  }
};

// List posts by PT with pagination
export const getPostsByPTId = async (req, res) => {
  try {
    const ptId = req.params.ptId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!ptId) return res.status(400).json({ error: "PT ID required" });

    const totalPosts = await Post.countDocuments({ author: ptId });
    const posts = await Post.find({ author: ptId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, totalPosts, page, totalPages: Math.ceil(totalPosts / limit) });
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Delete post (author or admin)
export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Get the sub this post belongs to
    const sub = await ForumSub.findById(post.sub);

    // Check permissions: author, admin, or moderator of the sub
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isMod =
      sub?.moderators?.some((m) => m.user.toString() === req.user._id.toString()) || false;

    if (!isAuthor && !isAdmin && !isMod) {
      return res.status(403).json({
        error: "Only the post author, admin, or moderators of this sub can delete this post",
      });
    }
    // Delete image from cloudinary if exists
    if (post.image?.public_id) {
      await deleteFromCloudinary(post.image.public_id);
    }

    // Delete the post
    await Post.findByIdAndRemove(id);

    if (sub) {
      await ForumSub.findByIdAndUpdate(sub._id, { $inc: { totalPosts: -1 } });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// ===== SUB SPONSORSHIP  =====

// 🔹 Update or Add Sponsorship
export const updateSubSponsorship = async (req, res) => {
  const { id } = req.params;
  const {
    sponsorName,
    sponsorLogo,
    sponsorMessage,
    sponsorWebsite,
    startDate,
    endDate,
  } = req.body;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Forum sub not found" });

    sub.isSponsored = true;
    sub.sponsorName = sponsorName || "";
    sub.sponsorLogo = sponsorLogo || "";
    sub.sponsorMessage = sponsorMessage || "";
    sub.sponsorWebsite = sponsorWebsite || "";
    sub.startDate = startDate ? new Date(startDate) : undefined;
    sub.endDate = endDate ? new Date(endDate) : undefined;

    await sub.save();
    res.json({ message: "Sponsorship updated successfully", sub });
  } catch (err) {
    console.error("Error updating sponsorship:", err);
    res.status(500).json({ error: "Failed to update sponsorship" });
  }
};

// 🔹 Remove Sponsorship
export const removeSubSponsorship = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Forum sub not found" });

    sub.isSponsored = false;
    sub.sponsorName = "";
    sub.sponsorLogo = "";
    sub.sponsorMessage = "";
    sub.sponsorWebsite = "";
    sub.startDate = undefined;
    sub.endDate = undefined;

    await sub.save();
    res.json({ message: "Sponsorship removed successfully", sub });
  } catch (err) {
    console.error("Error removing sponsorship:", err);
    res.status(500).json({ error: "Failed to remove sponsorship" });
  }
};

// Toggle pin/unpin post (admin, sub creator or sub mod only, cannot pin sponsored posts)
export const togglePinPost = async (req, res) => {
  const { subId } = req.params;
  const user = req.user; // from auth middleware

  try {
    const post = await Post.findById(subId).populate("sub");
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    const sub = post.sub;
    if (!sub) return res.status(404).json({ success: false, error: "Forum sub not found" });

    // Sponsored posts cannot be pinned/unpinned
    if (sub.isSponsored) {
      return res.status(403).json({ success: false, error: "Cannot pin/unpin sponsored posts" });
    }

    // Permissions check
    const isAdmin = user.role === "admin";
    const isSubOwner = sub.createdBy.toString() === user._id.toString();
    const isMod = sub.moderators?.some(
      (m) => m.user.toString() === user._id.toString() && m.role === "mod"
    );

    if (!isAdmin && !isSubOwner && !isMod) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to pin/unpin this post",
      });
    }

    // Toggle pinned
    post.pinned = !post.pinned;
    await post.save();

    res.json({
      success: true,
      message: `Post ${post.pinned ? "pinned" : "unpinned"} successfully`,
      post,
    });
  } catch (err) {
    console.error("Toggle pin error:", err);
    res.status(500).json({ success: false, error: "Failed to toggle pin" });
  }
};
