import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import toast from "react-hot-toast";
import {
  Bot,
  Send,
  Plus,
  AlertTriangle,
  LogIn,
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  sendAssistantMessage,
  listAssistantConversations,
  getAssistantConversation,
  getGuestQuota,
  renameAssistantConversation,
  deleteAssistantConversation,
  claimGuestConversations,
  getGuestToken,
} from "../../api/ai";
import { useAuth } from "../../contexts/AuthContext";

const GUEST_LIMIT_CODE = "AI_GUEST_LIMIT";
const SUGGESTED_KEYS = ["assistant_suggest_1", "assistant_suggest_2", "assistant_suggest_3"];

export default function Assistant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isGuest = !user || user.role === "guest";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [guestLimited, setGuestLimited] = useState(false);
  const [guestQuota, setGuestQuota] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [claimPrompt, setClaimPrompt] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const bottomRef = useRef(null);

  const refreshQuota = async () => {
    if (!isGuest) return;
    try {
      const res = await getGuestQuota();
      setGuestQuota(res.guestQuota);
      if (res.guestQuota && res.guestQuota.remaining === 0) setGuestLimited(true);
    } catch {
      /* quota display is best-effort */
    }
  };

  const refreshConversations = async () => {
    try {
      const res = await listAssistantConversations();
      setConversations(res.conversations || []);
    } catch {
      /* history is best-effort */
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    refreshConversations();
    refreshQuota();
    // Logged-in user with a stored guest token → offer to claim guest chats
    if (!isGuest && getGuestToken()) {
      listAssistantConversations()
        .then((res) => {
          if ((res.conversations || []).length > 0) setClaimPrompt(true);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (e, presetText = null) => {
    e?.preventDefault();
    const text = (presetText ?? input).trim();
    if (!text || sending || guestLimited) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await sendAssistantMessage({
        message: text,
        conversationId,
      });
      setConversationId(res.conversationId);
      if (res.guestQuota) setGuestQuota(res.guestQuota);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          sources: res.sources || [],
          escalated: res.escalated,
        },
      ]);
      refreshConversations();
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === GUEST_LIMIT_CODE) {
        setGuestLimited(true);
        if (err.response?.data?.guestQuota) setGuestQuota(err.response.data.guestQuota);
        toast.error(t("assistant_guest_limit"));
      } else {
        toast.error(err.response?.data?.error || t("assistant_error"));
        setInput(text); // restore so user can retry
      }
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setGuestLimited(false);
    refreshQuota();
  };

  const openConversation = async (id) => {
    try {
      const res = await getAssistantConversation(id);
      setConversationId(res.conversation._id);
      setMessages(
        (res.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources || [],
        })),
      );
      setShowHistory(false);
    } catch {
      toast.error(t("assistant_load_error"));
    }
  };

  const saveRename = async (id) => {
    const title = editTitle.trim();
    if (!title) return setEditingId(null);
    try {
      await renameAssistantConversation(id, title);
      setConversations((cs) =>
        cs.map((c) => (c._id === id ? { ...c, title } : c)),
      );
      toast.success(t("assistant_renamed"));
    } catch {
      toast.error(t("assistant_error"));
    } finally {
      setEditingId(null);
    }
  };

  const removeConversation = async (id) => {
    try {
      await deleteAssistantConversation(id);
      setConversations((cs) => cs.filter((c) => c._id !== id));
      if (conversationId === id) newChat();
      toast.success(t("assistant_deleted"));
    } catch {
      toast.error(t("assistant_error"));
    }
  };

  const claimGuest = async () => {
    setClaiming(true);
    try {
      const res = await claimGuestConversations();
      if (res.claimed > 0) {
        toast.success(t("assistant_claimed", { count: res.claimed }));
        localStorage.removeItem("ai_guest_token");
        refreshConversations();
      }
    } catch {
      toast.error(t("assistant_error"));
    } finally {
      setClaiming(false);
      setClaimPrompt(false);
    }
  };

  const dismissClaim = () => {
    setClaimPrompt(false);
    localStorage.removeItem("ai_guest_token");
  };

  return (
    <div className="min-h-screen bg-alice pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="text-caribbean" size={26} />
            <div>
              <h1 className="text-xl font-bold text-caribbean">
                {t("assistant_title")}
              </h1>
              <p className="text-xs text-gray-500">{t("assistant_subtitle")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="btn btn-xs border border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
            >
              {t("assistant_history")}
            </button>
            <button
              onClick={newChat}
              className="btn btn-xs border border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
            >
              <Plus size={14} className="mr-1" /> {t("assistant_new_chat")}
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-800 flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{t("assistant_disclaimer")}</span>
        </div>

        {/* Guest remaining counter */}
        {isGuest && guestQuota && !guestLimited && (
          <p className="text-center text-xs text-caribbean font-medium mb-3">
            {t("assistant_remaining", { count: guestQuota.remaining })}
          </p>
        )}

        {/* Guest limit banner */}
        {guestLimited && isGuest && (
          <div className="bg-caribbean text-white rounded-lg p-4 mb-4 text-sm">
            <p className="font-semibold mb-1">{t("assistant_limit_title")}</p>
            <p className="mb-3">{t("assistant_limit_body")}</p>
            <div className="flex gap-2">
              <Link
                to="/login"
                className="btn btn-xs bg-white text-caribbean hover:bg-gray-100"
              >
                <LogIn size={14} className="mr-1" /> {t("assistant_login")}
              </Link>
              <Link
                to="/signup"
                className="btn btn-xs bg-tufts hover:bg-caribbean text-white border-0"
              >
                <UserPlus size={14} className="mr-1" /> {t("assistant_signup")}
              </Link>
            </div>
          </div>
        )}

        {/* Claim guest chats banner (logged-in user with guest history) */}
        {claimPrompt && !isGuest && (
          <div className="bg-tufts text-white rounded-lg p-4 mb-4 text-sm flex flex-wrap items-center justify-between gap-2">
            <span>{t("assistant_claim_prompt")}</span>
            <div className="flex gap-2">
              <button
                onClick={claimGuest}
                disabled={claiming}
                className="btn btn-xs bg-white text-tufts hover:bg-gray-100"
              >
                {claiming ? t("ai_saving") : t("assistant_claim_yes")}
              </button>
              <button
                onClick={dismissClaim}
                className="btn btn-xs btn-ghost text-white hover:bg-white/20"
              >
                {t("assistant_claim_no")}
              </button>
            </div>
          </div>
        )}

        {/* History dropdown */}
        {showHistory && (
          <div className="bg-white border border-gray-200 rounded-lg mb-4 max-h-56 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="p-3 text-sm text-gray-500">
                {t("assistant_no_history")}
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c._id}
                className="flex items-center border-b border-gray-100 last:border-0 px-3 py-2 hover:bg-alice"
              >
                {editingId === c._id ? (
                  <>
                    <input
                      className="input input-xs input-bordered flex-1 mr-2"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(c._id)}
                      autoFocus
                    />
                    <button
                      onClick={() => saveRename(c._id)}
                      className="btn btn-xs btn-ghost text-caribbean"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn-xs btn-ghost text-gray-500"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openConversation(c._id)}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium text-caribbean text-sm truncate block">
                        {c.title}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(c.updatedAt).toLocaleString()}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(c._id);
                        setEditTitle(c.title);
                      }}
                      className="btn btn-xs btn-ghost text-gray-400 hover:text-caribbean"
                      title={t("assistant_rename")}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeConversation(c._id)}
                      className="btn btn-xs btn-ghost text-gray-400 hover:text-red-500"
                      title={t("assistant_delete")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat area */}
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
          style={{ height: "55vh" }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center mt-10">
                <Bot
                  size={44}
                  className="mx-auto mb-3 text-caribbean opacity-50"
                />
                <p className="text-sm text-gray-600 mb-4">
                  {t("assistant_welcome")}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => send(null, t(key))}
                      disabled={sending || guestLimited}
                      className="btn btn-xs border border-caribbean text-caribbean hover:bg-caribbean hover:text-white"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-caribbean text-white"
                      : "bg-alice text-gray-800 border border-gray-200"
                  }`}
                >
                  {m.content}
                  {m.sources?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 text-[11px] text-gray-500">
                      {t("assistant_sources")}:{" "}
                      {m.sources.map((s) => s.title).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-alice border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-500">
                  {t("assistant_thinking")}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder={t("assistant_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || guestLimited}
              maxLength={4000}
            />
            <button
              type="submit"
              className="btn bg-caribbean hover:bg-tufts text-white"
              disabled={sending || guestLimited || !input.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {isGuest && !guestLimited && guestQuota && (
          <p className="text-center text-[11px] text-gray-400 mt-2">
            {t("assistant_guest_note")}
          </p>
        )}
      </div>
    </div>
  );
}
