import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getConversations, markConversationAsRead, deleteConversation } from "../../api/messages";
import { useAuth } from "../../contexts/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { getSocket } from "../../socket";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const MessagesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();
  const socket = getSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.emit("joinRoom", loggedInUser._id);

    return () => {
      socket.off("message:new");
      socket.off("messageReceived");
      socket.off("conversation:read");
    };
  }, [loggedInUser]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        toast.error(t("failed_load_conversations"));
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [t]);

  useEffect(() => {
    const handleMessage = (msg) => {
      if (!msg || typeof msg !== 'object') return;

      const conversationId = msg.conversationId || msg.conversation;
      const sender = msg.sender || msg.from;
      const receiver = msg.receiver || msg.to;
      const content = msg.content || msg.body || "";

      if (!conversationId || !sender) return;

      setConversations((prev) => {
        const existing = prev.find((c) => String(c._id) === String(conversationId));

        if (existing) {
          return prev.map((c) => {
            if (String(c._id) !== String(conversationId)) return c;
            const isFromOther = sender !== loggedInUser._id;
            return {
              ...c,
              lastMessage: { content, sender, conversation: conversationId, updatedAt: msg.updatedAt || new Date().toISOString() },
              unread: isFromOther ? (c.unread || 0) + 1 : c.unread,
              updatedAt: msg.updatedAt || new Date().toISOString(),
            };
          });
        }

        if (prev.some((c) => String(c._id) === String(conversationId))) return prev;

        return [
          {
            _id: conversationId,
            participants: [{ _id: sender }, { _id: receiver }],
            unread: sender !== loggedInUser._id ? 1 : 0,
            lastMessage: { content, sender, conversation: conversationId, updatedAt: msg.updatedAt || new Date().toISOString() },
            updatedAt: msg.updatedAt || new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const handleConversationRead = ({ conversationId, unread }) => {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? { ...c, unread: unread || 0 } : c)));
    };

    socket.on("message:new", handleMessage);
    socket.on("messageReceived", handleMessage);
    socket.on("conversation:read", handleConversationRead);

    return () => {
      socket.off("message:new", handleMessage);
      socket.off("messageReceived", handleMessage);
      socket.off("conversation:read", handleConversationRead);
    };
  }, [loggedInUser]);

  const handleOpenConversation = async (convId, otherId) => {
    try {
      await markConversationAsRead(convId);
      setConversations((prev) => prev.map((c) => (c._id === convId ? { ...c, unread: 0 } : c)));
      navigate(`/messages/${otherId}`);
    } catch (error) {
      console.error("Error marking as read:", error);
      navigate(`/messages/${otherId}`);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();

    const backup = [...conversations];
    setConversations((prev) => prev.filter((c) => c._id !== convId));

    const toastUndo = toast((tObj) => (
      <div className="flex items-center gap-3">
        <span>{t("conversation_deleted")}</span>
        <button
          onClick={() => {
            setConversations(backup);
            toast.dismiss(tObj.id);
          }}
          className="text-blue-500 underline"
        >
          {t("undo")}
        </button>
      </div>
    ));

    setTimeout(async () => {
      try {
        await deleteConversation(convId);
      } catch (error) {
        setConversations(backup);
        toast.error(t("failed_delete_conversation"));
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="container mx-auto mt-20 px-4">
        <h1 className="text-2xl font-semibold text-caribbean mb-6 flex items-center gap-2">
          <MessageSquare /> {t("messages")}
        </h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && conversations.length < 1) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="bg-caribbean/10 p-6 rounded-full mb-6">
          <MessageSquare className="w-12 h-12 text-caribbean" />
        </div>
        <h2 className="text-2xl font-semibold text-caribbean mb-2">
          {t("no_conversations")}
        </h2>
        <p className="text-gray-500 max-w-md mb-6">
          {t("start_connecting")}
        </p>
        <button
          onClick={() => navigate("/messages/users")}
          className="px-6 py-2.5 bg-caribbean text-white rounded-xl hover:bg-tufts transition-all duration-200 shadow-sm"
        >
          {t("find_someone_message")}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-12 px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-caribbean flex items-center gap-2">
          {t("messages")}
        </h1>
        <button
          onClick={() => navigate("/messages/users")}
          className="flex items-center gap-2 px-6 py-2.5 bg-caribbean text-white rounded-xl hover:bg-tufts transition-all duration-200 shadow-sm"
        >
          <MessageSquare size={16} />
          {t("new")}
        </button>
      </div>

      <div className="bg-base-200 rounded-lg shadow-md divide-y divide-base-300">
        {conversations.map((conv) => {
          const other = conv.participants.find((p) => p._id !== loggedInUser._id);

          return (
            <div key={conv._id} className="flex w-full items-center gap-4 p-4 hover:bg-base-300 transition">
              <button
                onClick={() => handleOpenConversation(conv._id, other._id)}
                className="flex-1 text-left flex items-center gap-4"
              >
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img src={other?.profileImageUrl || avatar} alt={other?.fullName} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">{other?.fullName}</h2>
                    <span className="text-xs text-gray-400">
                      {new Date(conv.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage?.content || t("no_new_messages")}
                  </p>
                </div>

                {conv.unread > 0 && <span className="badge badge-primary">{conv.unread}</span>}
              </button>

              <button
                onClick={(e) => handleDeleteConversation(e, conv._id)}
                className="btn btn-ghost btn-sm text-error hover:bg-red-100"
                title={t("delete_conversation")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesPage;
