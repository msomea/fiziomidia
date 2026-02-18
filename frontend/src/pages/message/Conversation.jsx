import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";
import { getSocket } from "../../socket";
import { useTranslation } from "react-i18next";

import ConversationHeader from "../../components/message/ConversationHeader";
import ConversationMessages from "../../components/message/ConversationMessages";
import ConversationInput from "../../components/message/ConversationInput";

export default function ConversationPage() {
  const { t } = useTranslation();
  const { id: otherUserId } = useParams();
  const { user: loggedInUser } = useAuth();
  const navigate = useNavigate();
  const socket = getSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ===========================
  // JOIN ROOM & REGISTER SOCKET
  // ===========================
  useEffect(() => {
    if (!loggedInUser?._id || !socket) return;

    // Join personal room
    const joinRoom = () => socket.emit("joinRoom", loggedInUser._id);
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);

    // ===========================
    // ONLINE USERS EVENTS
    // ===========================
    const handleOnlineUsers = (userIds) => setOnlineUsers(userIds || []);
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    };
    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userWentOnline", handleUserOnline);
    socket.on("userWentOffline", handleUserOffline);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userWentOnline", handleUserOnline);
      socket.off("userWentOffline", handleUserOffline);
    };
  }, [loggedInUser, socket]);

  // Update other user online status whenever onlineUsers change
  useEffect(() => {
    setIsOtherUserOnline(onlineUsers.includes(otherUserId));
  }, [onlineUsers, otherUserId]);

  // ===========================
  // FETCH CONVERSATION & MESSAGES
  // ===========================
  useEffect(() => {
    if (!loggedInUser?._id) return;

    const loadConversation = async () => {
      setLoading(true);
      try {
        const res = await API.get(`${API_URL}/conversations/user/${otherUserId}`);
        setConversation(res.data);

        // Normalize messages
        const normalizedMessages = (res.data.messages || []).map((m) => ({
          ...m,
          status:
            String(m.receiver?._id || m.receiver) === String(loggedInUser._id)
              ? "read"
              : m.status || "sent",
        }));
        setMessages(normalizedMessages);

        // Notify server that conversation is open
        socket.emit("conversation:open", {
          conversationId: res.data._id,
          userId: loggedInUser._id,
        });

        // Acknowledge delivery & read for received messages
        normalizedMessages.forEach((m) => {
          const receiverId = m.receiver?._id || m.receiver;
          if (String(receiverId) === String(loggedInUser._id)) {
            if (!m.status || m.status === "sent") {
              socket.emit("message:delivered", { messageId: m._id, userId: loggedInUser._id });
              socket.emit("message:read", { messageId: m._id, userId: loggedInUser._id });
            }
          }
        });
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_conversation"));
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    loadConversation();
  }, [otherUserId, loggedInUser, socket, t, scrollToBottom]);

  // ===========================
  // NEW MESSAGE LISTENER
  // ===========================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (payload.conversationId !== conversation?._id) return;

      const msgObj = {
        _id: payload.messageId || payload._id,
        conversation: payload.conversationId,
        sender: payload.sender,
        receiver: payload.receiver,
        content: payload.content,
        createdAt: payload.createdAt || new Date().toISOString(),
        status: payload.status || "sent",
      };

      setMessages((prev) => [...prev, msgObj]);
      scrollToBottom();

      if (String(payload.receiver) === String(loggedInUser?._id)) {
        socket.emit("message:delivered", { messageId: msgObj._id, userId: loggedInUser._id });
        socket.emit("message:read", { messageId: msgObj._id, userId: loggedInUser._id });
      }
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [conversation?._id, loggedInUser?._id, socket, scrollToBottom]);

  // ===========================
  // MESSAGE STATUS UPDATES
  // ===========================
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status } : m))
      );
    };

    socket.on("message:status", handleStatusUpdate);
    return () => socket.off("message:status", handleStatusUpdate);
  }, [socket]);

  // ===========================
  // CONVERSATION READ NOTIFICATIONS
  // ===========================
  useEffect(() => {
    if (!socket) return;

    const handleConversationRead = ({ conversationId }) => {
      if (conversationId !== conversation?._id) return;

      setMessages((prev) =>
        prev.map((m) => {
          const receiverId = m.receiver?._id || m.receiver;
          if (String(receiverId) === String(loggedInUser?._id) && m.status !== "read") {
            return { ...m, status: "read" };
          }
          return m;
        })
      );
    };

    socket.on("conversation:read", handleConversationRead);
    return () => socket.off("conversation:read", handleConversationRead);
  }, [conversation?._id, loggedInUser?._id, socket]);

  // ===========================
  // SEND MESSAGE
  // ===========================
  const handleSend = () => {
    if (!message.trim() || !conversation?._id) return;

    socket.emit("sendMessage", {
      sender: loggedInUser._id,
      receiver: otherUserId,
      content: message,
      conversationId: conversation._id,
    });

    setMessage("");
    scrollToBottom();
  };

  // ===========================
  // DELETE MESSAGE
  // ===========================
  const handleDeleteMessage = async (messageId) => {
    const backup = [...messages];
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    toast((tObj) => (
      <div className="flex items-center gap-3">
        <span>{t("message_deleted")}</span>
        <button
          onClick={() => {
            setMessages(backup);
            toast.dismiss(tObj.id);
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));

    setTimeout(async () => {
      try {
        await API.delete(`${API_URL}/messages/${messageId}`);
      } catch (error) {
        setMessages(backup);
        toast.error(t("failed_delete_message"));
      }
    }, 5000);
  };

  if (loading || !conversation) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">
          {t("loading_conversations")}
        </p>
      </div>
    );
  }

  const otherUser = conversation?.participants.find((p) => p._id !== loggedInUser._id);

  return (
    <div className="flex mt-20 flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto bg-base-200 rounded-lg">
      <ConversationHeader
        otherUser={otherUser}
        isOtherUserOnline={isOtherUserOnline}
        navigateBack={() => navigate(-1)}
      />

      <ConversationMessages
        messages={messages}
        loggedInUser={loggedInUser}
        handleDeleteMessage={handleDeleteMessage}
        messagesEndRef={messagesEndRef}
      />

      <ConversationInput
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
      />
    </div>
  );
}
