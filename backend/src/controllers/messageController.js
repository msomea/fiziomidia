import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Send a new message
export const sendMessage = async (req, res) => {
  const sender = req.user._id;
  const { conversationId, receiver, content } = req.body;

  try {
    // Create the new message
    const newMessage = await Message.create({
      conversation: conversationId,
      sender,
      receiver,
      content,
    });

    // Update the conversation: push to messages, set lastMessage, increment unread for receiver
    const convo = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: newMessage._id },
        $set: { lastMessage: newMessage._id },
        $inc: { [`unreadCounts.${receiver}`]: 1 },
      },
      { new: true }
    )
      .populate("participants", "fullName profileImageUrl role")
      .populate({
        path: "messages",
        select: "sender receiver content createdAt",
      })
      .lean();

    res.status(201).json({ message: newMessage, conversation: convo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId,
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a message (owner or admin)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only sender or admin can delete
    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await message.deleteOne();
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
