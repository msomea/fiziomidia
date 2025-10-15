import ForumSub from "../models/ForumSub.js";
import Post from "../models/Post.js";

// ===== SUBS =====

// List all forum subs
export const listSubs = async (req, res) => {
  try {
    const subs = await ForumSub.find().limit(100).sort({ createdAt: -1 });
    res.json({ subs });
    console.log('Returned Subs', subs)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subs" });
  }
};

// Get a single sub by ID
export const getSubById = async (req, res) => {
  const { id } = req.params;
  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Sub not found" });
    res.json({ sub });
  } catch (err) {
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
    res.status(500).json({ error: "Failed to create sub" });
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
    res.status(500).json({ error: "Failed to create post" });
  }
};

// List posts for a specific sub
export const listPosts = async (req, res) => {
  const { subId } = req.params;

  try {
    const posts = await Post.find({ sub: subId })
      .populate("author", "fullName email") // optional: select fields
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Vote on a post (upvote = 1, downvote = -1)
export const votePost = async (req, res) => {
  const { id } = req.params; // post ID
  const { vote } = req.body; // 1 = upvote, -1 = downvote

  if (![1, -1].includes(vote)) {
    return res.status(400).json({ error: "Vote must be 1 (upvote) or -1 (downvote)" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id.toString();

    // Remove user from both arrays first
    post.upvotes = post.upvotes.filter(u => u.toString() !== userId);
    post.downvotes = post.downvotes.filter(u => u.toString() !== userId);

    // Add to the appropriate array
    if (vote === 1) {
      post.upvotes.push(req.user._id);
    } else if (vote === -1) {
      post.downvotes.push(req.user._id);
    }

    await post.save();

    // Calculate total score
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

// Get a single post by ID, including user's vote status
export const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).populate("author", "fullName email");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user?._id?.toString(); // optional, if authenticated
    let userVote = 0;

    if (userId) {
      if (post.upvotes.map(u => u.toString()).includes(userId)) userVote = 1;
      else if (post.downvotes.map(u => u.toString()).includes(userId)) userVote = -1;
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


