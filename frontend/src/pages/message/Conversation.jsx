import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Send, PhoneIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import API from "../../api/axios";
import { API_URL } from "../../config/constants"
import { useAuth } from "../../context/AuthContext";
import avatar from "../../assets/avatar.jpg"

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
    setMessage("");
    scrollToBottom();
  };

  if (loading)
    return <p className="p-4 mt-16 text-gray-600">Loading conversation...</p>;

  const otherUser = conversation?.participants.find(
    (p) => p._id !== loggedInUser._id
  );

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return toast.error("Message ID missing");
    console.log("Message ID", messageId)

    // Backup original list
    const originalMessages = [...messages];

    // Remove instantly from UI
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    // Undo toast (5 seconds)
    const undoToast = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Message deleted</span>

          <button
            onClick={() => {
              setMessages(originalMessages);
              toast.dismiss(t.id);
            }}
            className="text-blue-500 underline"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    try {
      // Delay real delete (to allow undo)
      setTimeout(async () => {
        await API.delete(`/messages/${messageId}`);
      }, 5000);

    } catch (error) {
      // Restore original messages
      setMessages(originalMessages);
      toast.error("Error deleting message");
    }
  };


  return (
    <div className="flex mt-20 flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto bg-base-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-base-300 border-b border-base-300">
  
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="avatar">
          <div className="w-10 rounded-full">
            <img
              src={`${API_URL}${otherUser?.profileImageUrl}` || avatar}
              alt="User"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-lg">
            {otherUser?.fullName || "User"}
          </span>
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* RIGHT SIDE — PHONE BUTTON */}
      {otherUser?.phone && (
        <a
          href={`tel:${otherUser.phone}`}
          className="p-2 rounded-full hover:bg-base-200 text-green-600"
          title={`Call ${otherUser.fullName}`}
        >
          <PhoneIcon className="w-5 h-5" />
        </a>
      )}

    </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">
            Start the conversation by sending a message.
          </p>
        )}
        {messages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender; // HANDLE BOTH FORMATS
          const isMe = senderId === loggedInUser._id;

          return (
            <div
              key={msg._id}
              className={`chat ${isMe ? "chat-end" : "chat-start"}`}
            >
              {/* WRAPPER WITH GROUP */}
              <div className="relative group">

                <div
                  className={`chat-bubble ${
                    isMe
                      ? "chat-bubble-primary text-white"
                      : "chat-bubble-secondary"
                  }`}
                >
                  {msg.content}
                </div>

                {/* DELETE BUTTON */}
                {isMe && (
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white text-xs rounded-full 
                    opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}

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
