import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
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
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Join Room
  useEffect(() => {
    if (loggedInUser?._id) {
      socket.emit("joinRoom", loggedInUser._id);
    }
  }, [loggedInUser]);

  // Fetch Conversation
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${API_URL}/conversations/user/${otherUserId}`);
        setConversation(res.data);

        const normalizedMessages = (res.data.messages || []).map((m) => {
          const receiverId = m.receiver?._id || m.receiver;
          if (String(receiverId) === String(loggedInUser._id)) {
            return { ...m, status: "read" };
          }
          return m;
        });

        setMessages(normalizedMessages);

        const otherUser = res.data.participants.find(
          (p) => p._id !== loggedInUser._id
        );
        setIsOtherUserOnline(otherUser?.isLoggedIn || false);

        socket.emit("conversation:open", {
          conversationId: res.data._id,
          userId: loggedInUser._id,
        });

        // Acknowledge messages
        const receivedMessages = (res.data.messages || []).filter(
          (m) => String(m.receiver?._id || m.receiver) === String(loggedInUser._id)
        );

        receivedMessages.forEach((m) => {
          if (m.status === "sent" || !m.status) {
            socket.emit("message:delivered", { messageId: m._id, userId: loggedInUser._id });
          }
          socket.emit("message:read", { messageId: m._id, userId: loggedInUser._id });
        });
      } catch (err) {
        console.error(err);
        toast.error(t("failed_load_conversation"));
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    load();
  }, [otherUserId, loggedInUser, t, socket]);

  // Listen for new messages
  useEffect(() => {
    const handler = (payload) => {
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

    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [conversation, loggedInUser, socket]);

  // Message status updates
  useEffect(() => {
    const statusHandler = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status } : m))
      );
    };
    socket.on("message:status", statusHandler);
    return () => socket.off("message:status", statusHandler);
  }, [socket]);

  // Conversation read notifications
  useEffect(() => {
    const convReadHandler = ({ conversationId }) => {
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

    socket.on("conversation:read", convReadHandler);
    return () => socket.off("conversation:read", convReadHandler);
  }, [conversation, loggedInUser, socket]);

  // Online/offline tracking
  useEffect(() => {
    socket.on("userWentOnline", ({ userId }) => {
      if (userId === otherUserId) setIsOtherUserOnline(true);
    });
    socket.on("userWentOffline", ({ userId }) => {
      if (userId === otherUserId) setIsOtherUserOnline(false);
    });

    return () => {
      socket.off("userWentOnline");
      socket.off("userWentOffline");
    };
  }, [otherUserId, socket]);

  // Send message
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

  // Delete message
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

  const otherUser = conversation?.participants.find(
    (p) => p._id !== loggedInUser._id
  );

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
