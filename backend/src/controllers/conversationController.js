import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const createConversation = async (req, res) => {
  const sender = req.user._id;
  const { receiver } = req.body;

  let convo = await Conversation.findOne({
    participants: { $all: [sender, receiver] },
  }).lean();

  if (convo) return res.json(convo);

  const newConvo = await Conversation.create({
    participants: [sender, receiver],
    unreadCounts: {
      [sender]: 0,
      [receiver]: 0,
    },
  });

  res.status(201).json(newConvo.toObject());
};



// Get all conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName _id isLoggedIn profileImageUrl phone role")
      .populate({
        path: "lastMessage",
        select: "sender receiver content createdAt",
      })
      .sort({ updatedAt: -1 });

    // Include unread count for logged-in user
    const data = conversations.map((c) => ({
      ...c.toObject(),
      unread: c.unreadCounts.get(userId.toString()) || 0,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get conversation between logged-in user and another user
export const getConversationWithUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.id;

    // Find the conversation between the two users
    const convo = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    })
      .populate("participants", "fullName _id isLoggedIn profileImageUrl phone role") // populate participants
      .populate({
        path: "lastMessage",
        select: "sender receiver content createdAt",
      })
      .populate({
        path: "messages",
        select: "sender receiver content createdAt status",
        populate: {
          path: "sender receiver",
          select: "fullName _id isLoggedIn profileImageUrl phone role",
        },
      })
      .lean();

    if (!convo)
      return res.status(404).json({ message: "Conversation not found" });

    // Add unread count for logged-in user
    const data = {
      ...convo,
      unread: convo.unreadCounts?.[userId.toString()] || 0,
    };

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Delete a conversation by ID
export const deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      participants: req.user._id, // only allow deletion if the user is a participant
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Messages will be deleted automatically via pre('findOneAndDelete') middleware

    return res.status(200).json({ message: "Conversation and messages deleted" });
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUnreadCount = async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    convo.unreadCounts.set(req.user._id.toString(), 0);
    await convo.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};