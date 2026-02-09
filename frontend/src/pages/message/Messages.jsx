import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { API_URL, ASSET_URL, SOCKET_URL } from "../../config/constants";
import { io } from "socket.io-client";
import { Loader2 } from "lucide-react";

const socket = io(SOCKET_URL, { withCredentials: true });

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
        const res = await API.get(`${API_URL}/conversations`);
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
      // Validate message structure before processing
      if (!msg || typeof msg !== 'object') {
        console.warn("Invalid message structure received:", msg);
        return;
      }
      
      // Normalize payload: accept either { conversationId } or { conversation }
      const conversationId = msg.conversationId || msg.conversation;
      const sender = msg.sender || msg.from;
      const receiver = msg.receiver || msg.to;
      const content = msg.content || msg.body || "";
      
      // Validate required fields
      if (!conversationId || !sender) {
        console.warn("Missing required message fields:", { conversationId, sender });
        return;
      }

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
      await API.put(`${API_URL}/conversations/${convId}/mark-read`);

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

  // ------------------------------------------
  // DELETE CONVERSATION
  // ------------------------------------------
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();

    const backup = [...conversations];
    setConversations((prev) => prev.filter((c) => c._id !== convId));

    const toastUndo = toast((t) => (
      <div className="flex items-center gap-3">
        <span>Conversation deleted</span>
        <button
          onClick={() => {
            setConversations(backup);
            toast.dismiss(t.id);
          }}
          className="text-blue-500 underline"
        >
          Undo
        </button>
      </div>
    ));

    setTimeout(async () => {
      try {
        await API.delete(`${API_URL}/conversations/${convId}`);
      } catch (error) {
        setConversations(backup);
        toast.error("Could not delete conversation");
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-caribbean animate-spin" />
        <p className="mt-4 text-caribbean font-medium animate-pulse">Loading Conversations...</p>
      </div>
    );
  }

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
            <div
              key={conv._id}
              className="flex w-full items-center gap-4 p-4 hover:bg-base-300 transition"
            >
              <button
                onClick={() => handleOpenConversation(conv._id, other._id)}
                className="flex-1 text-left flex items-center gap-4"
              >
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img
                      src={
                        other?.profileImageUrl
                          ? other.profileImageUrl
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
                    {conv.lastMessage?.content || "No New messages"}
                  </p>
                </div>

                {conv.unread > 0 && (
                  <span className="badge badge-primary">{conv.unread}</span>
                )}
              </button>

              <button
                onClick={(e) => handleDeleteConversation(e, conv._id)}
                className="btn btn-ghost btn-sm text-error hover:bg-red-100"
                title="Delete conversation"
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
