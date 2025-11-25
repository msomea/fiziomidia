// src/pages/MessagesPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const MessagesPage = () => {
  const { user: loggedInUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

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
  console.log("Conversations", conversations)

  if (loading) return <p className="p-4 mt-60 text-gray-600">Loading conversations...</p>;
  if (conversations.length<1) return (
  <div className="container mx-auto mt-20 px-4 py-6">
    <p className="font-semibold text-caribbean mb-6 flex items-center gap-2">Welcome to FizioMidia Messages! This is where your messages will appear</p>
  </div>
  );

  return (
    <div className="container mx-auto mt-10 px-4 py-6">
      <h1 className="text-2xl font-semibold text-caribbean mb-6 flex items-center gap-2">
        <MessageSquare /> Messages
      </h1>

      <div className="bg-base-200 rounded-lg shadow-md divide-y divide-base-300">
        {conversations.map((conv) => {
          // find other participant
          const other = conv.participants.find(p => p._id !== loggedInUser._id);

          return (
            <Link
              key={conv._id}
              to={`/messages/${other._id}`}
              className="flex items-center gap-4 p-4 hover:bg-base-300 transition"
            >
              <div className="avatar">
                <div className="w-12 rounded-full">
                  <img src={other.profileImageUrl || "/avatars/default.jpg"} alt={other.fullName} />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">{other.fullName}</h2>
                  <span className="text-xs text-gray-400">{new Date(conv.updatedAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {conv.lastMessage?.content || "No messages yet"}
                </p>
              </div>

              {conv.unread > 0 && (
                <span className="badge badge-primary">{conv.unread}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesPage;
