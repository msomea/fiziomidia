import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { getSocket } from "../../socket";
import { API_URL } from "../../config/constants";
import { useAuth } from "../../context/AuthContext";
import avatar from "../../assets/avatar.jpg";
import { Search } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const socket = getSocket(); // Use the shared socket instance

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);

  // ===============================
  // FETCH USERS FROM BACKEND
  // ===============================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get(
          `${API_URL}/users`,
        );

        setUsers(data);
      } catch (err) {
        toast.error("Failed to load users");
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ===============================
  // SOCKET - Listen for online users
  // ===============================
  useEffect(() => {
    if (!currentUser?._id) return;

    const handleOnlineUsers = (userIds) => {
      console.log("📡 UsersPage: Received onlineUsers:", userIds);
      setOnlineUsers(userIds || []);
    };

    const handleUserOnline = (data) => {
      const userId = data?.userId || data;
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    };

    const handleUserOffline = (data) => {
      const userId = data?.userId || data;
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    };

    // Set up listeners
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
      const otherUser =
        data.sender === currentUser._id
          ? data.receiver
          : data.sender;

      setConversations((prev) => ({
        ...prev,
        [otherUser]: {
          lastMessage: data.content,
          updatedAt: data.updatedAt,
        },
      }));
    });

    // Emit joinRoom to get online users list (wait for connection)
    const emitJoin = () => {
      console.log("📤 UsersPage: Emitting joinRoom for:", currentUser._id);
      socket.emit("joinRoom", currentUser._id);
    };

    if (socket.connected) {
      emitJoin();
    } else {
      console.log("⏳ UsersPage: socket not connected yet, waiting to emit joinRoom...");
      socket.once("connect", emitJoin);
    }

    // Cleanup
    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userWentOnline", handleUserOnline);
      socket.off("userWentOffline", handleUserOffline);
      socket.off("conversation:updatePreview");
      socket.off("message:new");
    };
  }, [currentUser]);

  // ===============================
  // FILTER + SORT
  // ===============================
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u._id !== currentUser?._id)
      .filter((u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const aTime = conversations[a._id]?.updatedAt || 0;
        const bTime = conversations[b._id]?.updatedAt || 0;
        return bTime - aTime;
      });
  }, [users, search, conversations, currentUser]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading users...
      </div>
    );
  }

  // ===============================
  // UX
  // ===============================
  console.log(onlineUsers)
  return (
    <div className="h-screen flex flex-col  mx-auto mt-10 px-4 py-6">

      {/* Header */}
      <div className="bg-caribbean text-white p-4 text-lg font-semibold">
        Chats
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
          />
          <input
            type="text"
            placeholder="Search or start new chat"
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
          const lastMessage =
            conversations[user._id]?.lastMessage ||
            "Start conversation";
          const time = conversations[user._id]?.updatedAt
            ? new Date(
                conversations[user._id].updatedAt
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <div
              key={user._id}
              onClick={() =>
                navigate(`/messages/user/${user._id}`)
              }
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="relative">
                <img
                  src={
                    user.profileImageUrl || avatar
                  }
                  alt={user.name}
                  className="w-12 h-12 ring ring-caribbean rounded-full object-cover"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
                {!isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate text-caribbean">
                    {user.fullName}
                  </p>
                  <span className="text-xs text-gray-400">
                    {time}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {lastMessage}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
