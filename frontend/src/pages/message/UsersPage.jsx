import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { getSocket } from "../../socket";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { Search } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ProfileBadge from "../../components/Badge";

export default function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const socket = getSocket();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get(`${API_URL}/users`);
        setUsers(data);
      } catch (err) {
        toast.error(t("failed_load_users"));
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [t]);

  useEffect(() => {
    if (!currentUser?._id) return;

    const handleOnlineUsers = (userIds) => setOnlineUsers(userIds || []);
    const handleUserOnline = (data) => {
      const userId = data?.userId || data;
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    };
    const handleUserOffline = (data) => {
      const userId = data?.userId || data;
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userWentOnline", handleUserOnline);
    socket.on("userWentOffline", handleUserOffline);

    socket.on("conversation:updatePreview", (data) => {
      setConversations((prev) => ({
        ...prev,
        [data.userId]: {
          lastMessage: data.lastMessage,
          updatedAt: data.updatedAt,
        },
      }));
    });

    socket.on("message:new", (data) => {
      const otherUser = data.sender === currentUser._id ? data.receiver : data.sender;
      setConversations((prev) => ({
        ...prev,
        [otherUser]: {
          lastMessage: data.content,
          updatedAt: data.updatedAt,
        },
      }));
    });

    const emitJoin = () => socket.emit("joinRoom", currentUser._id);
    if (socket.connected) emitJoin();
    else socket.once("connect", emitJoin);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userWentOnline", handleUserOnline);
      socket.off("userWentOffline", handleUserOffline);
      socket.off("conversation:updatePreview");
      socket.off("message:new");
    };
  }, [currentUser, socket]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u._id !== currentUser?._id)
      .filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aTime = conversations[a._id]?.updatedAt || 0;
        const bTime = conversations[b._id]?.updatedAt || 0;
        return bTime - aTime;
      });
  }, [users, search, conversations, currentUser]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col mx-auto mt-10 px-4 py-6 animate-pulse">
        
        {/* Header Skeleton */}
        <div className="bg-caribbean p-4">
          <div className="h-5 w-32 bg-white/40 rounded"></div>
        </div>

        {/* Search Skeleton */}
        <div className="p-3 border-b">
          <div className="h-10 bg-gray-300 rounded-full"></div>
        </div>

        {/* Users Skeleton List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 border-b"
            >
              {/* Avatar Skeleton */}
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>

              {/* Text Skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-300 rounded"></div>
                  <div className="h-3 w-10 bg-gray-200 rounded"></div>
                </div>
                <div className="h-3 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col mx-auto mt-10 px-4 py-6">

      {/* Header */}
      <div className="bg-caribbean text-white p-4 text-lg font-semibold">
        {t("chats")}
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
          <input
            type="text"
            placeholder={t("search_or_start")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-500 rounded-full outline-none text-tufts"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const lastMessage = conversations[user._id]?.lastMessage || t("start_conversation");
          const time = conversations[user._id]?.updatedAt
            ? new Date(conversations[user._id].updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          return (
            <div
              key={user._id}
              onClick={() => navigate(`/messages/user/${user._id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="relative">
                <img src={user.profileImageUrl || avatar} alt={user.fullName} className="w-12 h-12 ring ring-caribbean rounded-full object-cover" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"}`}></span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate text-caribbean">{user.fullName}{" "}
                  <ProfileBadge role={user.role} showTooltip={false} />
                  </span>
                  
                  <span className="text-xs text-gray-400">{time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
