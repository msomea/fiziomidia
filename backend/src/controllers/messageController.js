import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id; // user comes from auth middleware

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Save message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Update conversation
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Emit Socket.IO event (notify receiver)
    req.io.to(receiverId.toString()).emit("receiveMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: { $in: req.user._id } },
        { receiver: { $in: req.user._id } },
      ],
    })
      .where("conversation")
      .equals(conversationId)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
