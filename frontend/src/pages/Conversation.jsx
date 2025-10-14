// src/pages/ConversationPage.jsx
import { useParams } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

const ConversationPage = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("");

  const messages = [
    { id: 1, sender: "other", text: "Hi there! How are you feeling today?" },
    { id: 2, sender: "me", text: "Feeling much better, thanks for asking!" },
  ];

  const handleSend = () => {
    if (message.trim() === "") return;
    console.log("Send:", message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto bg-base-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-base-300 border-b border-base-300">
        <Link to="/messages">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src="/avatars/jane.jpg" alt="PT" />
            </div>
          </div>
          <h2 className="font-semibold text-lg">Dr. Jane Doe</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${msg.sender === "me" ? "chat-end" : "chat-start"}`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "me"
                  ? "chat-bubble-primary text-white"
                  : "chat-bubble-secondary"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered w-full"
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
