import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { API_URL } from "../../config/constants";
import { io } from "socket.io-client";

const socket = io(API_URL, { withCredentials: true });

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------
  // CONNECT SOCKET & JOIN ROOM ON LOAD
  // ------------------------------------------
  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.emit("joinRoom", loggedInUser._id);

    return () => {
      socket.off("message:new");
      socket.off("messageReceived");
      socket.off("conversation:read");
    };
  }, [loggedInUser]);

  // ------------------------------------------
  // FETCH INITIAL CONVERSATIONS
  // ------------------------------------------
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await API.get("/conversations");
        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // ------------------------------------------
  // LISTEN FOR NEW MESSAGES
  // ------------------------------------------
  useEffect(() => {
    // Backend emits `message:new`. Some older code may emit `messageReceived`.
    const handleMessage = (msg) => {
      // Normalize payload: accept either { conversationId } or { conversation }
      const conversationId = msg.conversationId || msg.conversation;
      const sender = msg.sender || msg.from;
      const receiver = msg.receiver || msg.to;
      const content = msg.content || msg.body || "";

      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);

        // If conversation exists → update it
        if (existing) {
          return prev.map((c) => {
            if (c._id !== conversationId) return c;

            const isFromOther = sender !== loggedInUser._id;

            return {
              ...c,
              lastMessage: { content, sender, conversation: conversationId, updatedAt: msg.updatedAt || new Date().toISOString() },
              unread: isFromOther ? (c.unread || 0) + 1 : c.unread,
              updatedAt: msg.updatedAt || new Date().toISOString(),
            };
          });
        }

        // If new conversation → insert it at top
        return [
          {
            _id: conversationId,
            participants: [
              { _id: sender },
              { _id: receiver },
            ],
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
    socket.on("messageReceived", handleMessage); // fallback
    socket.on("conversation:read", handleConversationRead);

    return () => {
      socket.off("message:new", handleMessage);
      socket.off("messageReceived", handleMessage);
      socket.off("conversation:read", handleConversationRead);
    };
  }, [loggedInUser]);

  // ------------------------------------------
  // OPEN CONVERSATION → MARK READ
  // ------------------------------------------
  const handleOpenConversation = async (convId, otherId) => {
    try {
      await API.put(`/conversations/${convId}/mark-read`);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === convId ? { ...c, unread: 0 } : c
        )
      );

      navigate(`/messages/${otherId}`);
    } catch (error) {
      console.error("Error marking as read:", error);
      navigate(`/messages/${otherId}`);
    }
  };

  if (loading)
    return <p className="p-4 mt-60 text-gray-600">Loading conversations...</p>;

  if (conversations.length < 1)
    return (
      <div className="container mx-auto mt-20 px-4 py-6">
        <p className="font-semibold text-caribbean mb-6 flex items-center gap-2">
          Welcome to FizioMidia Messages! Your conversations will appear here.
        </p>
      </div>
    );

  return (
    <div className="container mx-auto mt-10 px-4 py-6">
      <h1 className="text-2xl font-semibold text-caribbean mb-6 flex items-center gap-2">
        <MessageSquare /> Messages
      </h1>

      <div className="bg-base-200 rounded-lg shadow-md divide-y divide-base-300">
        {conversations.map((conv) => {
          const other = conv.participants.find(
            (p) => p._id !== loggedInUser._id
          );

          return (
            <button
              key={conv._id}
              onClick={() => handleOpenConversation(conv._id, other._id)}
              className="flex w-full text-left items-center gap-4 p-4 hover:bg-base-300 transition"
            >
              <div className="avatar">
                <div className="w-12 rounded-full">
                  <img
                    src={
                      other?.profileImageUrl
                        ? `${API_URL}${other.profileImageUrl}`
                        : avatar
                    }
                    alt={other?.fullName}
                  />
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
                  {conv.lastMessage?.content || "No messages yet"}
                </p>
              </div>

              {conv.unread > 0 && (
                <span className="badge badge-primary">{conv.unread}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesPage;
