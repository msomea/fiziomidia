import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { API_URL } from "../config/constants";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to manage and track total unread message count
 * Fetches initial unread count and listens for socket updates
 */
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const conversationUnreadRef = useRef({}); // Track unread count per conversation

  // Fetch initial unread count from all conversations
  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get(`${API_URL}/conversations`);
        const conversations = res.data;

        // Build a map of conversation unread counts
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

  // Listen for socket events and update unread count
  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    // Ensure user has joined their room
    socket.emit("joinRoom", user._id);

    // Handle new message - increment unread count if from other user
    const handleNewMessage = (msg) => {
      const conversationId = msg.conversationId || msg.conversation;
      const sender = msg.sender || msg.from;

      // Only increment if message is from another user
      if (
        sender !== user._id &&
        msg.unread !== null &&
        msg.unread !== undefined
      ) {
        // Update the map for this conversation
        conversationUnreadRef.current[conversationId] = msg.unread;

        // Recalculate total unread
        const total = Object.values(conversationUnreadRef.current).reduce(
          (sum, count) => sum + (count || 0),
          0,
        );
        setUnreadCount(total);
      }
    };

    // Handle message status update (e.g., message marked as read)
    const handleMessageStatus = ({
      messageId,
      status,
      conversationId: statusConversationId,
    }) => {
      // When a message is marked as read, decrement unread count for that conversation
      if (status === "read") {
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Update conversation unread map - use the conversationId from event
        if (
          statusConversationId &&
          conversationUnreadRef.current[statusConversationId] > 0
        ) {
          conversationUnreadRef.current[statusConversationId]--;
        }
      }
    };

    // Handle conversation read event - reset unread for that conversation
    const handleConversationRead = ({ conversationId, unread }) => {
      const previousCount = conversationUnreadRef.current[conversationId] || 0;
      conversationUnreadRef.current[conversationId] = unread || 0;

      // Update total unread
      setUnreadCount((prev) => {
        const diff = previousCount - (unread || 0);
        return Math.max(0, prev - diff);
      });
    };

    // Listen for events
    socket.on("message:new", handleNewMessage);
    socket.on("messageReceived", handleNewMessage); // fallback for older events
    socket.on("message:status", handleMessageStatus);
    socket.on("conversation:read", handleConversationRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("messageReceived", handleNewMessage);
      socket.off("message:status", handleMessageStatus);
      socket.off("conversation:read", handleConversationRead);
    };
  }, [user?._id]);

  return { unreadCount, loading };
};
