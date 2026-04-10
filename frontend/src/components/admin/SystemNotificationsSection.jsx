import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Send, Users, UserCheck, AlertCircle, MessageSquare } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import { useDashboard } from "../../contexts/DashboardContext";
import { fetchAllUsers, sendSystemNotification } from "../../api/admin";

/**
 * SystemNotificationsSection - Admin component for sending system notifications
 * 
 * Features:
 * - Send notifications to all users or specific users
 * - Priority selection (critical, important, update, information)
 * - Message composition with character limit
 * - User search and selection
 */
export default function SystemNotificationsSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("information");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all"); // "all", "member", "physiotherapist", "specific"

  // Priority configurations matching NotificationSection
  const priorityConfig = {
    critical: {
      color: "text-red-600 border-red-300 bg-red-50",
      label: "Critical",
      description: "Requires immediate attention",
      icon: AlertCircle
    },
    important: {
      color: "text-orange-600 border-orange-300 bg-orange-50", 
      label: "Important",
      description: "Requires action",
      icon: UserCheck
    },
    update: {
      color: "text-blue-600 border-blue-300 bg-blue-50",
      label: "Update", 
      description: "Status changes",
      icon: MessageSquare
    },
    information: {
      color: "text-green-600 border-green-300 bg-green-50",
      label: "Information",
      description: "General information",
      icon: MessageSquare
    }
  };

  // Fetch users for targeted notifications
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await fetchAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(t('failed_to_load_users'));
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if ((showUserSearch || roleFilter === "specific") && users.length === 0) {
      fetchUsers();
    }
  }, [showUserSearch, roleFilter, users.length]);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // When selecting specific users, show all users (no role filter)
    const matchesRole = roleFilter === "all" || roleFilter === "specific" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Handle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Send system notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error(t('notification_message_required'));
      return;
    }

    if (!sendToAll && roleFilter === "specific" && selectedUsers.length === 0) {
      toast.error(t('select_at_least_one_user'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        message: message.trim(),
        priority,
        sendToAll,
        targetUserIds: (!sendToAll && roleFilter === "specific" && selectedUsers.length > 0) ? selectedUsers : [],
        targetRole: !sendToAll && (roleFilter === "member" || roleFilter === "physiotherapist") ? roleFilter : null,
        type: 'system_announcement'
      };

      const data = await sendSystemNotification(payload);
      toast.success(data.message);
      
      // Reset form
      setMessage("");
      setSelectedUsers([]);
      setSendToAll(true);
      setSearchTerm("");
      setShowUserSearch(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.error || t('failed_to_send_notification'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CollapsibleSection title={t('system_notifications')}>
      <form onSubmit={handleSendNotification} className="space-y-4">
        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-tufts mb-2">
            {t('message')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('notification_message_placeholder')}
            className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-caribbean focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-700 mt-1">
            {message.length}{t('notification_characters_remaining')}
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-tufts mb-2">
            {t('priority_level')}
          </label>
          <div className="grid grid-cols-2 text-gray-700 gap-2">
            {Object.entries(priorityConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <label
                  key={key}
                  className={`flex items-center  p-3 border rounded-lg cursor-pointer transition-colors ${
                    priority === key
                      ? config.color
                      : "border-gray-400 hover:border-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={key}
                    checked={priority === key}
                    onChange={(e) => setPriority(e.target.value)}
                    className="sr-only"
                  />
                  <Icon className="w-4 h-4 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{config.label}</div>
                    <div className="text-xs opacity-75">{config.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-tufts mb-2">
            {t('send_to')}
          </label>
          <div className="flex gap-3 mb-3 text-gray-700">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={sendToAll}
                onChange={() => {
                  setSendToAll(true);
                  setSelectedUsers([]);
                }}
                className="mr-2"
              />
              <Users className="w-4 h-4 mr-1" />
              {t('all_users')}
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={!sendToAll && roleFilter === "member"}
                onChange={() => {
                  setSendToAll(false);
                  setRoleFilter("member");
                  setSelectedUsers([]);
                }}
                className="mr-2"
              />
              <UserCheck className="w-4 h-4 mr-1" />
              {t('all_members')}
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={!sendToAll && roleFilter === "physiotherapist"}
                onChange={() => {
                  setSendToAll(false);
                  setRoleFilter("physiotherapist");
                  setSelectedUsers([]);
                }}
                className="mr-2"
              />
              <UserCheck className="w-4 h-4 mr-1" />
              {t('all_pts')}
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={!sendToAll && roleFilter === "specific"}
                onChange={() => {
                  setSendToAll(false);
                  setRoleFilter("specific");
                  setSelectedUsers([]);
                  setShowUserSearch(true);
                }}
                className="mr-2"
              />
              <UserCheck className="w-4 h-4 mr-1" />
              {t('specific_users')}
            </label>
          </div>

          {/* User Selection for specific users */}
          {!sendToAll && (
            <div>
              <div className="mb-2 text-sm text-gray-700">
                {t('currently_filtering')} <span className="font-medium">
                  {roleFilter === "member" ? t('all_members') : 
                   roleFilter === "physiotherapist" ? t('all_pts') : 
                   roleFilter === "specific" ? t('specific_users') : 
                   t('all_users')}
                </span>
              </div>
              
              {roleFilter === "specific" && (
                <>
                  {selectedUsers.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700">
                      {selectedUsers.length} {t('users_selected')}
                    </div>
                  )}

                  <div className="mt-3 border border-gray-400 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-caribbean"></div>
                        <span className="ml-2 text-sm text-gray-700">{t('loading_users')}</span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder={t('search_users_placeholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-400 rounded-lg mb-3"
                        />
                        
                        <div className="space-y-2">
                          {filteredUsers.slice(0, 10).map(user => (
                            <label
                              key={user._id}
                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={() => toggleUserSelection(user._id)}
                                className="mr-3"
                              />
                              <div>
                                <div className="text-sm text-tufts font-medium">{user.fullName}</div>
                                <div className="text-xs text-gray-700">{user.email}</div>
                                <div className="text-xs text-blue-600">{user.role}</div>
                              </div>
                            </label>
                          ))}
                          {filteredUsers.length === 0 && (
                            <div className="text-center text-gray-700 py-4">
                              {t('no_users_found')}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !message.trim() || (!sendToAll && roleFilter === "specific" && selectedUsers.length === 0)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 
                   bg-caribbean text-white rounded-lg font-medium 
                   hover:bg-caribbean-dark disabled:opacity-50 
                   disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('sending_notification')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('send_notification')}
            </>
          )}
        </button>
      </form>
    </CollapsibleSection>
  );
}
