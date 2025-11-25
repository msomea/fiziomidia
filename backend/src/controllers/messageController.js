import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const sender = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    const receiver = conversation.participants.find(
      (p) => p.toString() !== sender.toString()
    );

    const message = await Message.create({
      conversation: conversationId,
      sender,
      receiver,
      content,
    });

    // Add message to conversation
    conversation.messages.push(message._id);
    conversation.lastMessage = message._id;

    // Increment unread count for the receiver
    conversation.unreadCounts.set(
      receiver.toString(),
      (conversation.unreadCounts.get(receiver.toString()) || 0) + 1
    );

    await conversation.save();

    res.status(201).json({ message });
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
