import ForumSub from "../models/ForumSub.js";
import Post from "../models/Post.js";

// ===== SUBS =====

// List all forum subs
export const listSubs = async (req, res) => {
  try {
    const subs = await ForumSub.find().limit(100).sort({ createdAt: -1 });
    res.json({ subs });
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
