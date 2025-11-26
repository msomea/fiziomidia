import { Server } from "socket.io";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      // Ensure socket.io responses include Access-Control-Allow-Credentials: true
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    //----------------------------------------------------------------------
    // JOIN USER PERSONAL ROOM
    //----------------------------------------------------------------------
    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined personal room`);
    });

    //----------------------------------------------------------------------
    // SEND MESSAGE EVENT
    //----------------------------------------------------------------------
    socket.on("sendMessage", async (data) => {
      try {
        const { sender, receiver, content, conversationId } = data;

        // Save message
        const message = await Message.create({
          sender,
          receiver,
          content,
          conversation: conversationId,
        });

        // Update conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        // Update fields
        conversation.messages.push(message._id);
        conversation.lastMessage = message._id;

        // Increase unread count for receiver
        const currentUnread =
          conversation.unreadCounts.get(receiver.toString()) || 0;
        conversation.unreadCounts.set(receiver.toString(), currentUnread + 1);

        await conversation.save();

        //------------------------------------------------------------------
        // EMIT NEW MESSAGE WITH UNREAD INFO
        //------------------------------------------------------------------
        io.to(receiver).emit("message:new", {
          conversationId,
          sender,
          content,
          updatedAt: conversation.updatedAt,
          unread: currentUnread + 1,
        });

        // Optional: Sender also gets confirmation
        socket.emit("message:new", {
          conversationId,
          sender,
          content,
          updatedAt: conversation.updatedAt,
          unread: 0,
        });
      } catch (err) {
        console.error("Socket sendMessage error:", err);
      }
    });

    //----------------------------------------------------------------------
    // MARK CONVERSATION AS READ
    //----------------------------------------------------------------------
    socket.on("conversation:open", async ({ conversationId, userId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        // Reset unread count for this user
        conversation.unreadCounts.set(userId.toString(), 0);
        await conversation.save();

        // Identify other participant
        const otherId = conversation.participants.find(
          (p) => p.toString() !== userId.toString()
        );

        //------------------------------------------------------------------
        // Notify sender AND receiver
        //------------------------------------------------------------------
        io.to(userId).emit("conversation:read", {
          conversationId,
          unread: 0,
        });

        if (otherId) {
          io.to(otherId).emit("conversation:read", {
            conversationId,
            unread: 0,
          });
        }
      } catch (err) {
        console.log("Error marking conversation read:", err);
      }
    });

    //----------------------------------------------------------------------
    // DISCONNECT
    //----------------------------------------------------------------------
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
