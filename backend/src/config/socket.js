import { Server } from "socket.io";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their personal room
    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined personal room`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      try {
        const { sender, receiver, content, conversationId } = data;

        // Save message in DB
        const message = await Message.create({
          sender,
          receiver,
          content,
          conversation: conversationId,
        });

        // Update conversation
        const conversation = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            $push: { messages: message._id },
            lastMessage: message._id,
            $inc: { [`unreadCounts.${receiver}`]: 1 },
          },
          { new: true }
        ).populate("messages");

        // Emit to sender (confirmation)
        socket.emit("messageReceived", message);

        // Emit to receiver if online
        io.to(receiver).emit("messageReceived", message);
      } catch (err) {
        console.error("Socket sendMessage error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
