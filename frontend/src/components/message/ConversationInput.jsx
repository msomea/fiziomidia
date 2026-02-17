import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ConversationInput({ message, setMessage, handleSend }) {
  const { t } = useTranslation();
  return (
    <div className="p-4 border-t border-base-300 flex gap-2">
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder={t("type_your_message")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        className="btn btn-primary flex items-center gap-1"
      >
        <Send size={16} /> {t("send")}
      </button>
    </div>
  );
}
