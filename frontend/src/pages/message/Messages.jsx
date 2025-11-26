import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MessageSquare } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { API_URL } from "../../config/constants";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
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

  // 👉 FUNCTION TO HANDLE OPENING A CONVERSATION
  const handleOpenConversation = async (convId, otherId) => {
    try {
      // 1. Mark unread as 0 in backend
      await API.put(`/conversations/${convId}/mark-read`);

      // 2. Update local state instantly so UI updates
      setConversations(prev =>
        prev.map(c =>
          c._id === convId ? { ...c, unread: 0 } : c
        )
      );

      // 3. Navigate to chat room
      navigate(`/messages/${otherId}`);

    } catch (error) {
      console.error("Error marking as read:", error);
      navigate(`/messages/${otherId}`); // fallback navigation
    }
  };

  console.log("Conversations", conversations);

  if (loading)
    return (
      <p className="p-4 mt-60 text-gray-600">
        Loading conversations...
      </p>
    );

  if (conversations.length < 1)
    return (
      <div className="container mx-auto mt-20 px-4 py-6">
        <p className="font-semibold text-caribbean mb-6 flex items-center gap-2">
          Welcome to FizioMidia Messages! This is where your messages will appear
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
                    src={`${API_URL}${other.profileImageUrl}` || avatar}
                    alt={other.fullName}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">{other.fullName}</h2>
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
