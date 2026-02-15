import { Server } from "socket.io";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

let onlineUsers = {};
let io;

const allowedOrigins = [
  "http://localhost:5173",
  "http://fiziomidia.org",
  "https://fiziomidia.org",
  "https://www.fiziomidia.org",
  "https://api.fiziomidia.org",
  "https://fiziomidia.netlify.app",
  "https://fiziomidia.pages.dev",
];

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Backend: User connected:", socket.id);
    console.log(
      "👥 Backend: Current online users count:",
      Object.keys(onlineUsers).length,
    );

    // =============================
    // JOIN PERSONAL ROOM
    // =============================
    socket.on("joinRoom", (userId) => {
      console.log("📥 Backend: joinRoom received from userId:", userId);
      socket.join(userId);

      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      if (!onlineUsers[userId].includes(socket.id)) {
        onlineUsers[userId].push(socket.id);
      }

      console.log("👥 Backend: Current onlineUsers:", Object.keys(onlineUsers));

      // First connection = user online
      if (onlineUsers[userId].length === 1) {
        io.emit("userWentOnline", { userId });
        console.log("🟢 Backend: Broadcasting userWentOnline:", userId);
      }

      // Emit full online list (important)
      const onlineList = Object.keys(onlineUsers);
      console.log("📡 Backend: Broadcasting onlineUsers:", onlineList);
      io.emit("onlineUsers", onlineList);
    });

    // =============================
    // SEND MESSAGE
    // =============================
    socket.on("sendMessage", async (data) => {
      try {
        const { sender, receiver, content, conversationId } = data;

        const message = await Message.create({
          sender,
          receiver,
          content,
          conversation: conversationId,
        });

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        conversation.messages.push(message._id);
        conversation.lastMessage = message._id;
        await conversation.save();

        const unreadCount = await Message.countDocuments({
          conversation: conversationId,
          receiver,
          status: { $ne: "read" },
        });

        const payload = {
          conversationId,
          sender,
          receiver,
          content,
          messageId: message._id,
          status: message.status,
          updatedAt: conversation.updatedAt,
          unread: unreadCount,
        };

        // Send to receiver
        io.to(receiver).emit("message:new", payload);

        // Confirmation to sender
        socket.emit("message:new", {
          ...payload,
          unread: 0,
        });

        // 🔥 IMPORTANT: Update chat list preview in real time
        io.to(receiver).emit("conversation:updatePreview", {
          conversationId,
          userId: sender,
          lastMessage: content,
          updatedAt: conversation.updatedAt,
        });

        io.to(sender).emit("conversation:updatePreview", {
          conversationId,
          userId: receiver,
          lastMessage: content,
          updatedAt: conversation.updatedAt,
        });
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    // =============================
    // MESSAGE STATUS (DELIVERED)
    // =============================
    socket.on("message:delivered", async ({ messageId, userId }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (msg.receiver.toString() !== userId.toString()) return;

      if (msg.status === "sent") {
        msg.status = "delivered";
        await msg.save();

        io.to(msg.sender.toString()).emit("message:status", {
          messageId,
          status: "delivered",
          conversationId: msg.conversation?.toString(),
        });
      }
    });

    // =============================
    // MESSAGE READ
    // =============================
    socket.on("message:read", async ({ messageId, userId }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (msg.receiver.toString() !== userId.toString()) return;

      if (msg.status !== "read") {
        msg.status = "read";
        await msg.save();

        io.to(msg.sender.toString()).emit("message:status", {
          messageId,
          status: "read",
          conversationId: msg.conversation?.toString(),
        });
      }
    });

    // =============================
    // CONVERSATION OPEN
    // =============================
    socket.on("conversation:open", async ({ conversationId, userId }) => {
      const unreadMessages = await Message.find({
        conversation: conversationId,
        receiver: userId,
        status: { $ne: "read" },
      });

      for (const m of unreadMessages) {
        m.status = "read";
        await m.save();

        io.to(m.sender.toString()).emit("message:status", {
          messageId: m._id,
          status: "read",
          conversationId: m.conversation?.toString(),
        });
      }

      io.to(userId).emit("conversation:read", {
        conversationId,
        unread: 0,
      });
    });

    // =============================
    // DISCONNECT
    // =============================
    socket.on("disconnect", () => {
      console.log("🔌 Backend: User disconnecting:", socket.id);
      const userId = Object.keys(onlineUsers).find((id) =>
        onlineUsers[id].includes(socket.id),
      );

      if (userId) {
        onlineUsers[userId] = onlineUsers[userId].filter(
          (id) => id !== socket.id,
        );

        console.log("🔴 Backend: User going offline:", userId);

        if (onlineUsers[userId].length === 0) {
          delete onlineUsers[userId];
          io.emit("userWentOffline", { userId });
        }

        const onlineList = Object.keys(onlineUsers);
        console.log("👥 Backend: Updated onlineUsers:", onlineList);
        io.emit("onlineUsers", onlineList);
      }
    });
  });

  return io;
};

export { io };
