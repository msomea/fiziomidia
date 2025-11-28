import { Send } from "lucide-react";

export default function ConversationInput({ message, setMessage, handleSend }) {
  return (
    <div className="p-4 border-t border-base-300 flex gap-2">
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        className="btn btn-primary flex items-center gap-1"
      >
        <Send size={16} /> Send
      </button>
    </div>
  );
}
