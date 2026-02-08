import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import API from "../../api/axios";
import { API_URL, SOCKET_URL } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import { SOCKET_URL } from "../../config/constants";
import { Loader2 } from "lucide-react";

import ConversationHeader from "../../components/message/ConversationHeader";
import ConversationMessages from "../../components/message/ConversationMessages";
import ConversationInput from "../../components/message/ConversationInput";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true
});

export default function ConversationPage() {
  const { id: otherUserId } = useParams();
  const { user: loggedInUser } = useAuth();
  const navigate = useNavigate();

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
        setMessages(res.data.messages);

        const otherUser = res.data.participants.find(
          (p) => p._id !== loggedInUser._id
        );
        setIsOtherUserOnline(otherUser?.isLoggedIn || false);

        // Reset unread (server will also mark messages as read)
        socket.emit("conversation:open", {
          conversationId: res.data._id,
          userId: loggedInUser._id,
        });

        // Acknowledge and mark as read any messages we fetched that were sent to this user
        try {
          const receivedMessages = (res.data.messages || []).filter(
            (m) => String(m.receiver?._id || m.receiver) === String(loggedInUser._id)
          );

          receivedMessages.forEach((m) => {
            // Mark as delivered if still in 'sent' state
            if (m.status === "sent" || !m.status) {
              socket.emit("message:delivered", { messageId: m._id, userId: loggedInUser._id });
            }
            // Mark as read (this will trigger server to update DB and notify sender)
            socket.emit("message:read", { messageId: m._id, userId: loggedInUser._id });
          });
        } catch (e) {
          // ignore acknowledgement errors
          console.error("Error acknowledging messages:", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    load();
  }, [otherUserId, loggedInUser]);

  // Listen for new messages and acknowledge delivery when appropriate
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

      // If current user is the receiver of this incoming message, acknowledge delivery and mark as read immediately
      if (String(payload.receiver) === String(loggedInUser?._id)) {
        socket.emit("message:delivered", {
          messageId: msgObj._id,
          userId: loggedInUser._id,
        });

        // Since conversation is already open, immediately mark as read
        socket.emit("message:read", {
          messageId: msgObj._id,
          userId: loggedInUser._id,
        });
      }
    };

    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [conversation, loggedInUser]);

  // Listen for message status updates (delivered/read)
  useEffect(() => {
    const statusHandler = (payload) => {
      const { messageId, status } = payload;
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, status } : m))
      );
    };

    socket.on("message:status", statusHandler);
    return () => socket.off("message:status", statusHandler);
  }, []);

  // Track online/offline
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
  }, [otherUserId]);

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

    const toastUndo = toast((t) => (
      <div className="flex items-center gap-3">
        <span>Message deleted</span>
        <button
          onClick={() => {
            setMessages(backup);
            toast.dismiss(t.id);
          }}
          className="text-blue-500 underline"
        >
          Undo
        </button>
      </div>
    ));

    setTimeout(async () => {
      try {
        await API.delete(`${API_URL}/messages/${messageId}`);
      } catch (error) {
        setMessages(backup);
        toast.error("Could not delete message");
      }
    }, 5000);
  };

  if (loading || !conversation) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Conversations...</p>
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
