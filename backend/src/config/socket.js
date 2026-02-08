import { Server } from "socket.io";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { userInfo } from "os";

let onlineUsers = {};
let io;

// Allwed Origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://fiziomidia.org",
  "https://fiziomidia.netlify.app",
  "https://fiziomidia.pages.dev",
  "https://fiziomidia.com",
];

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin:allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // JOIN USER PERSONAL ROOM
    socket.on("joinRoom", (userId) => {
      socket.join(userId);

      // Track online socket ids per user
      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      if (!onlineUsers[userId].includes(socket.id))
        onlineUsers[userId].push(socket.id);

      // If this is the first connection for the user, broadcast online
      if (onlineUsers[userId].length === 1) {
        io.emit("userWentOnline", { userId });
      }

      // Broadcast new comment
      socket.on("comment:new", async (data) => {
        const { postId, comment } = data;
        // Emit to everyone in the post room except sender
        socket.to(postId).emit("comment:new", comment);
      });
    });

    // SEND MESSAGE EVENT
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

        await conversation.save();

        // Count unread messages for receiver
        const unreadCount = await Message.countDocuments({
          conversation: conversationId,
          receiver,
          status: { $ne: "read" },
        });

        // EMIT NEW MESSAGE WITH UNREAD INFO (include messageId and status)

        const payloadForReceiver = {
          conversationId,
          sender,
          receiver,
          content,
          messageId: message._id,
          status: message.status,
          updatedAt: conversation.updatedAt,
          unread: unreadCount,
        };

        io.to(receiver).emit("message:new", payloadForReceiver);

        // Optional: Sender also gets confirmation (message saved)
        const payloadForSender = {
          conversationId,
          sender,
          receiver,
          content,
          messageId: message._id,
          status: message.status,
          updatedAt: conversation.updatedAt,
          unread: 0,
        };

        socket.emit("message:new", payloadForSender);
      } catch (err) {
        console.error("Socket sendMessage error:", err);
      }
    });

    // JOIN / LEAVE POST ROOMS (clients join a room per post to receive comment events)
    socket.on("joinPostRoom", (postId) => {
      if (!postId) return;
      socket.join(postId);
    });

    socket.on("leavePostRoom", (postId) => {
      if (!postId) return;
      socket.leave(postId);
    });

    // MESSAGE DELIVERED (recipient acknowledges receipt)
    socket.on("message:delivered", async ({ messageId, userId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        // Ensure only the receiver can mark delivered
        if (msg.receiver.toString() !== userId.toString()) return;

        if (msg.status === "sent") {
          msg.status = "delivered";
          await msg.save();

          // notify the sender and the receiver sockets
          io.to(msg.sender.toString()).emit("message:status", {
            messageId: msg._id,
            status: msg.status,
          });

          socket.emit("message:status", {
            messageId: msg._id,
            status: msg.status,
          });
        }
      } catch (err) {
        console.error("message:delivered error:", err);
      }
    });

    // MESSAGE READ (recipient/read event)
    socket.on("message:read", async ({ messageId, userId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        // Only receiver can mark read
        if (msg.receiver.toString() !== userId.toString()) return;

        if (msg.status !== "read") {
          msg.status = "read";
          await msg.save();

          // notify sender and receiver
          io.to(msg.sender.toString()).emit("message:status", {
            messageId: msg._id,
            status: msg.status,
          });

          socket.emit("message:status", {
            messageId: msg._id,
            status: msg.status,
          });
        }
      } catch (err) {
        console.error("message:read error:", err);
      }
    });

    // MARK CONVERSATION AS READ

    socket.on("conversation:open", async ({ conversationId, userId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        // Mark any messages directed to this user in the conversation as 'read'
        try {
          const unreadMessages = await Message.find({
            conversation: conversationId,
            receiver: userId,
            status: { $ne: "read" },
          });

          for (const m of unreadMessages) {
            m.status = "read";
            await m.save();

            // notify sender and receiver about the status change
            io.to(m.sender.toString()).emit("message:status", {
              messageId: m._id,
              status: "read",
            });

            io.to(userId).emit("message:status", {
              messageId: m._id,
              status: "read",
            });
          }
        } catch (e) {
          console.error("Error updating message read statuses:", e);
        }
        // Identify other participant
        const otherId = conversation.participants.find(
          (p) => p.toString() !== userId.toString()
        );

        // Notify sender AND receiver

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

    // DISCONNECT

    socket.on("disconnect", () => {
      // Remove user from online list
      const userId = Object.keys(onlineUsers).find((id) =>
        onlineUsers[id].includes(socket.id)
      );

      if (userId) {
        onlineUsers[userId] = onlineUsers[userId].filter(
          (id) => id !== socket.id
        );

        // If no more sockets remain for this user, mark offline and broadcast
        if (onlineUsers[userId].length === 0) {
          delete onlineUsers[userId];
          // Broadcast to all connected clients that this user went offline
          io.emit("userWentOffline", { userId });
        }
      }
    });
  });

  return io;
};

export { io };
