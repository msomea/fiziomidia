import ForumSub from "../models/ForumSub.js";
import Post from "../models/Post.js";

// ===== SUBS =====

// List all forum subs with totalPosts dynamically calculated
export const listSubs = async (req, res) => {
  try {
    const subs = await ForumSub.aggregate([
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "sub",
          as: "posts",
        },
      },
      {
        $addFields: {
          totalPosts: { $size: "$posts" },
        },
      },
      {
        $project: {
          posts: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
    ]);

    res.json({ subs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subs" });
  }
};

// Get single sub
export const getSubById = async (req, res) => {
  const { id } = req.params;
  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Sub not found" });
    res.json({ sub });
  } catch {
    res.status(400).json({ error: "Invalid Sub ID" });
  }
};

// Create a new sub (PTs or Admin only)
export const createSub = async (req, res) => {
  if (req.user.role !== "physiotherapist" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only verified PTs or admin can create subs" });
  }

  const { title, slug, description } = req.body;

  try {
    const sub = new ForumSub({
      title,
      slug,
      description,
      createdBy: req.user._id,
    });

    await sub.save();
    res.status(201).json({ sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create sub" });
  }
};

// Delete a sub (Admin only)
export const deleteSub = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only Admins can delete forum subs" });
    }

    const { id } = req.params;
    const sub = await ForumSub.findById(id);

    if (!sub) {
      return res.status(404).json({ error: "Forum sub not found" });
    }

    // Pre-remove hook will cascade delete posts
    await sub.remove();

    res.json({
      message: `Forum sub "${sub.title}" and its posts have been deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting sub:", err);
    res.status(500).json({ error: "Failed to delete forum sub" });
  }
};

// ===== POSTS =====

// Create a post under a sub
export const createPost = async (req, res) => {
  const { subId, title, body } = req.body;

  try {
    const post = new Post({
      sub: subId,
      author: req.user._id,
      title,
      body,
    });

    await post.save();
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// List posts in a sub
export const listPosts = async (req, res) => {
  const { subId } = req.params;
  try {
    const posts = await Post.find({ sub: subId })
      .populate("author", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Vote on a post
export const votePost = async (req, res) => {
  const { id } = req.params;
  const { vote } = req.body;

  if (![1, -1].includes(vote)) {
    return res
      .status(400)
      .json({ error: "Vote must be 1 (upvote) or -1 (downvote)" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id.toString();

    post.upvotes = post.upvotes.filter((u) => u.toString() !== userId);
    post.downvotes = post.downvotes.filter((u) => u.toString() !== userId);

    if (vote === 1) post.upvotes.push(req.user._id);
    else post.downvotes.push(req.user._id);

    await post.save();

    const totalScore = post.upvotes.length - post.downvotes.length;

    res.json({
      postId: post._id,
      totalScore,
      userVote: vote,
      upvotesCount: post.upvotes.length,
      downvotesCount: post.downvotes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to vote on post" });
  }
};

// Get single post (with vote info)
export const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).populate("author", "fullName email");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user?._id?.toString();
    let userVote = 0;

    if (userId) {
      if (post.upvotes.map((u) => u.toString()).includes(userId)) userVote = 1;
      else if (post.downvotes.map((u) => u.toString()).includes(userId))
        userVote = -1;
    }

    const totalScore = post.upvotes.length - post.downvotes.length;

    res.json({
      postId: post._id,
      title: post.title,
      body: post.body,
      author: post.author,
      totalScore,
      upvotesCount: post.upvotes.length,
      downvotesCount: post.downvotes.length,
      userVote,
      createdAt: post.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// Delete post (author or admin)
export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Author or admin can delete
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only author or admin can delete this post" });
    }

    await post.remove();

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};


// Add sponsorship (Admin only)
export const addSponsorship = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only Admins can manage sub sponsorships" });
  }

  const { id } = req.params;
  const { sponsorName, sponsorLogo, sponsorMessage } = req.body;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Sub not found" });

    sub.isSponsored = true;
    sub.sponsorName = sponsorName;
    sub.sponsorLogo = sponsorLogo;
    sub.sponsorMessage = sponsorMessage;

    await sub.save();

    res.json({ message: "Sponsorship added successfully", sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add sponsorship" });
  }
};

// Remove sponsorship
export const removeSponsorship = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only Admins can remove sponsorships" });
  }

  const { id } = req.params;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Sub not found" });

    sub.isSponsored = false;
    sub.sponsorName = undefined;
    sub.sponsorLogo = undefined;
    sub.sponsorMessage = undefined;

    await sub.save();

    res.json({ message: "Sponsorship removed successfully", sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove sponsorship" });
  }
};