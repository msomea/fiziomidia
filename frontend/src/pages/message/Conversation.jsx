import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
const REACT_APP_BACKEND_URL = import.meta.env.VITE_SOCKET_URL;

const socket = io(REACT_APP_BACKEND_URL || "http://localhost:4000");

const ConversationPage = () => {
  const { id: otherUserId } = useParams();
  const { user: loggedInUser } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Join user's personal room
  useEffect(() => {
    if (!loggedInUser?._id) return;
    socket.emit("joinRoom", loggedInUser._id);
  }, [loggedInUser]);

  // Fetch conversation once
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/conversations/user/${otherUserId}`);
        if (res.data) {
          setConversation(res.data);
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };
    fetchConversation();
  }, [otherUserId]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("messageReceived", (newMessage) => {
      // Only add messages for this conversation
      if (
        newMessage.conversation === conversation?._id ||
        newMessage.sender === otherUserId ||
        newMessage.receiver === otherUserId
      ) {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }
    });

    return () => socket.off("messageReceived");
  }, [conversation, otherUserId]);

  // Send message
  const handleSend = () => {
    if (!message.trim() || !conversation) return;

    const msgData = {
      sender: loggedInUser._id,
      receiver: otherUserId,
      content: message,
      conversationId: conversation._id,
    };

    socket.emit("sendMessage", msgData);

    // Optimistic UI
    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setMessage("");
    scrollToBottom();
  };

  if (loading)
    return <p className="p-4 mt-20 text-gray-600">Loading conversation...</p>;

  const otherUser = conversation?.participants.find(
    (p) => p._id !== loggedInUser._id
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto bg-base-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-base-300 border-b border-base-300">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img
                src={otherUser?.profileImageUrl || "/avatars/default-user.jpg"}
                alt="User"
              />
            </div>
          </div>
          <h2 className="font-semibold text-lg">{otherUser?.fullName}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">
            Start the conversation by sending a message.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat ${
              msg.sender === loggedInUser._id || msg.sender._id === loggedInUser._id
                ? "chat-end"
                : "chat-start"
            }`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === loggedInUser._id || msg.sender._id === loggedInUser._id
                  ? "chat-bubble-primary text-white"
                  : "chat-bubble-secondary"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered w-full"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="btn btn-primary flex items-center gap-1"
        >
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
};

export default ConversationPage;
