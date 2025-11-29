import React from "react";
import { Check } from "lucide-react";

export default function ConversationMessages({
  messages,
  loggedInUser,
  handleDeleteMessage,
  messagesEndRef,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          Start the conversation by sending a message.
        </p>
      )}

      {messages.map((msg) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMe = senderId === loggedInUser._id;

        return (
          <div key={msg._id} className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
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

              {isMe && (
                <div className="absolute -top-2 -right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {msg._id && (
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className="p-1 bg-red-600 text-white text-xs rounded-full"
                    >
                      ✕
                    </button>
                  )}

                  {/* Message status indicator for messages sent by me */}
                  {msg.status === "sent" && (
                    <span className="text-white flex items-center">
                      <Check size={14} />
                    </span>
                  )}

                  {msg.status === "delivered" && (
                    <span className="text-white flex items-center">
                      <Check size={12} />
                      <Check size={12} className="-ml-1" />
                    </span>
                  )}

                  {msg.status === "read" && (
                    <span className="text-caribbean flex items-center">
                      <Check size={12} />
                      <Check size={12} className="-ml-1" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
