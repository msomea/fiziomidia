import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { API_URL } from "../config/constants";
import { getSocket } from "../socket";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook to manage and track total unread message count
 */
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track unread count per conversation
  const conversationUnreadRef = useRef({});

  /**
   * Fetch initial unread counts
   */
  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get(`${API_URL}/conversations`);
        const conversations = res.data || [];

        const unreadMap = {};
        let totalUnread = 0;

        conversations.forEach((conv) => {
          const count = conv.unread || 0;
          unreadMap[conv._id] = count;
          totalUnread += count;
        });

        conversationUnreadRef.current = unreadMap;
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
  }, [user?._id]);

  /**
   * Socket listeners
   */
  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    if (!socket) return; // ✅ guard

    /**
     * Connection handlers
     */
    const handleConnect = () => {
      socket.emit("joinRoom", user._id);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Join immediately if already connected
    if (socket.connected) {
      socket.emit("joinRoom", user._id);
    }

    /**
     * New message handler
     */
    const handleNewMessage = (msg) => {
      const conversationId = msg.conversationId || msg.conversation;
      const sender = msg.sender || msg.from;

      if (!conversationId) return;

      // Only count messages from other users
      if (sender !== user._id) {
        const current = conversationUnreadRef.current[conversationId] || 0;

        conversationUnreadRef.current[conversationId] = current + 1;

        // Recalculate total
        const total = Object.values(conversationUnreadRef.current).reduce(
          (sum, count) => sum + (count || 0),
          0,
        );

        setUnreadCount(total);
      }
    };

    /**
     * Message status handler (read receipts)
     */
    const handleMessageStatus = ({ status, conversationId }) => {
      if (status === "read" && conversationId) {
        const current = conversationUnreadRef.current[conversationId] || 0;

        if (current > 0) {
          conversationUnreadRef.current[conversationId] = current - 1;

          const total = Object.values(conversationUnreadRef.current).reduce(
            (sum, count) => sum + (count || 0),
            0,
          );

          setUnreadCount(total);
        }
      }
    };

    /**
     * Conversation read handler
     */
    const handleConversationRead = ({ conversationId, unread }) => {
      if (!conversationId) return;

      conversationUnreadRef.current[conversationId] = unread || 0;

      const total = Object.values(conversationUnreadRef.current).reduce(
        (sum, count) => sum + (count || 0),
        0,
      );

      setUnreadCount(total);
    };

    /**
     * Register listeners
     */
    // Register for message events - these should work alongside Messages.jsx
    socket.on("message:new", (msg) => {
      handleNewMessage(msg);
    });

    socket.on("message:status", (data) => {
      handleMessageStatus(data);
    });

    socket.on("conversation:read", (data) => {
      handleConversationRead(data);
    });

    /**
     * Cleanup
     */
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("conversation:read", handleConversationRead);
    };
  }, [user?._id]);

  return { unreadCount, loading };
};