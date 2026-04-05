import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { CacheService } from "../utils/redis.js";
import User from "../models/User.js";
import { io } from "../config/socket.js";

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

    // Invalidate user profile caches due to new conversation
    await CacheService.del(`user:${sender}:profile`);
    await CacheService.del(`user:${receiver}:profile`);
    console.log(
      `🗑️ User profile cache invalidated for users: ${sender}, ${receiver} due to new conversation`,
    );

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
      deletedBy: { $ne: userId }, // Exclude conversations deleted by current user
    })
      .populate(
        "participants",
        "fullName _id isLoggedIn profileImageUrl phone role",
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
// Delete a conversation by ID (soft delete - only for current user)
export const deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    // Find conversation and check if user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Add current user to deletedBy array if not already there
    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();

      // Invalidate user profile cache due to conversation deletion
      await CacheService.del(`user:${userId}:profile`);
      console.log(
        `🗑️ User profile cache invalidated for user: ${userId} due to conversation deletion`,
      );
    }

    // Check if all participants have deleted the conversation
    if (conversation.deletedBy.length === conversation.participants.length) {
      // All participants deleted it, so delete all messages and the conversation
      await Message.deleteMany({ _id: { $in: conversation.messages } });
      await Conversation.findByIdAndDelete(conversationId);
      return res
        .status(200)
        .json({ message: "Conversation and all messages deleted permanently" });
    }

    return res.status(200).json({ message: "Conversation deleted for you" });
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

    // Find unread messages from others to current user
    const unreadMessages = await Message.find({
      conversation: req.params.id,
      receiver: req.user._id,
      status: { $ne: "read" },
    });

    // Mark each as read and notify the original sender via socket
    for (const m of unreadMessages) {
      m.status = "read";
      await m.save();

      // Invalidate sender's user profile cache due to message read status change
      await CacheService.del(`user:${m.sender}:profile`);
      console.log(
        `🗑️ User profile cache invalidated for user: ${m.sender} due to message read status change`,
      );

      try {
        if (io && m.sender) {
          io.to(m.sender.toString()).emit("message:status", {
            messageId: m._id,
            status: "read",
            conversationId: m.conversation?.toString(),
          });
        }
      } catch (err) {
        console.warn("Failed to emit message:status in mark-read:", err);
      }
    }

    // Also notify the current user that the conversation is read (unread:0)
    try {
      if (io) {
        io.to(req.user._id.toString()).emit("conversation:read", {
          conversationId: convo._id.toString(),
          unread: 0,
        });
      }
    } catch (err) {
      console.warn("Failed to emit conversation:read in mark-read:", err);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};