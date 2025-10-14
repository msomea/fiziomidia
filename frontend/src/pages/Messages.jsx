// src/pages/MessagesPage.jsx
import { Link } from "react-router";
import { MessageSquare } from "lucide-react";

const MessagesPage = () => {
  const conversations = [
    {
      id: 1,
      user: { name: "Dr. Jane Doe", avatar: "/avatars/jane.jpg", role: "PT" },
      lastMessage: "Let's schedule your session tomorrow.",
      time: "2h ago",
      unread: 2,
    },
    {
      id: 2,
      user: { name: "Michael James", avatar: "/avatars/mike.jpg", role: "Member" },
      lastMessage: "Thanks for the advice!",
      time: "1d ago",
      unread: 0,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <MessageSquare /> Messages
      </h1>

      <div className="bg-base-200 rounded-lg shadow-md divide-y divide-base-300">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            to={`/messages/${conv.id}`}
            className="flex items-center gap-4 p-4 hover:bg-base-300 transition"
          >
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img src={conv.user.avatar} alt={conv.user.name} />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{conv.user.name}</h2>
                <span className="text-xs text-gray-400">{conv.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {conv.lastMessage}
              </p>
            </div>

            {conv.unread > 0 && (
              <span className="badge badge-primary">{conv.unread}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
