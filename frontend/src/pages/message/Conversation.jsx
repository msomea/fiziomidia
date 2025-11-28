import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/constants";

import ConversationHeader from "../../components/message/ConversationHeader";
import ConversationMessages from "../../components/message/ConversationMessages";
import ConversationInput from "../../components/message/ConversationInput";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const socket = io(SOCKET_URL || "http://localhost:4000");

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
        const res = await API.get(`/conversations/user/${otherUserId}`);
        setConversation(res.data);
        setMessages(res.data.messages);

        const otherUser = res.data.participants.find(
          (p) => p._id !== loggedInUser._id
        );
        setIsOtherUserOnline(otherUser?.isLoggedIn || false);

        // Reset unread
        socket.emit("conversation:open", {
          conversationId: res.data._id,
          userId: loggedInUser._id,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    load();
  }, [otherUserId, loggedInUser]);

  // Listen for new messages
  useEffect(() => {
    const handler = (payload) => {
      if (payload.conversationId !== conversation?._id) return;
      setMessages((prev) => [...prev, payload]);
      scrollToBottom();
    };

    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [conversation]);

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
        await API.delete(`/messages/${messageId}`);
      } catch (error) {
        setMessages(backup);
        toast.error("Could not delete message");
      }
    }, 5000);
  };

  if (loading)
    return (
      <p className="p-4 mt-20 text-gray-600">Loading conversation...</p>
    );

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
