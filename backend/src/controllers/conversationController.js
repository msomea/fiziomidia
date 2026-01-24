import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const createConversation = async (req, res) => {
  try {
    const sender = req.user._id;
    const { receiver } = req.body;

    if (!receiver)
      return res.status(400).json({ message: "Receiver required" });

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
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};



// Get all conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate(
        "participants",
        "fullName _id isLoggedIn profileImageUrl phone role"
      )
      .populate({
        path: "lastMessage",
        select: "sender receiver content createdAt",
      })
      .sort({ updatedAt: -1 });

    // Calculate unread count from messages with status !== 'read'
    const data = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await Message.countDocuments({
          conversation: c._id,
          receiver: userId,
          status: { $ne: "read" },
        });
        return {
          ...c.toObject(),
          unread: unreadCount,
        };
      })
    );

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
      .populate(
        "participants",
        "fullName _id isLoggedIn profileImageUrl phone role"
      ) // populate participants
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

    // Calculate unread count from messages with status !== 'read'
    const unreadCount = await Message.countDocuments({
      conversation: convo._id,
      receiver: userId,
      status: { $ne: "read" },
    });

    // Add unread count for logged-in user
    const data = {
      ...convo,
      unread: unreadCount,
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
    if (!convo)
      return res.status(404).json({ message: "Conversation not found" });

    // Mark all messages from other user to current user as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        receiver: req.user._id,
        status: { $ne: "read" },
      },
      { status: "read" }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};