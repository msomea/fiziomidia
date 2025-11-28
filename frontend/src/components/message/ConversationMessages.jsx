import React from "react";

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

              {isMe && msg._id && (
                <button
                  onClick={() => handleDeleteMessage(msg._id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition"
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
  );
}
