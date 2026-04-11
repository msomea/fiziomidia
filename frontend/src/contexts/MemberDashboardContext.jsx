import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useMemberDashboard as useMemberDashboardData } from '../hooks/useMemberDashboard';
import { getUserNotifications, markNotificationAsRead } from '../api/notifications';
import toast from 'react-hot-toast';

// Context
const MemberDashboardContext = createContext();

// Provider component
export const MemberDashboardProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const dashboardData = useMemberDashboardData();

  // Refresh notifications
  const refreshNotifications = useCallback(async (memberId) => {
    try {
      const notificationsData = await getUserNotifications(memberId);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Notifications refresh error:', error);
      toast.error('Failed to refresh notifications');
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (memberId, notificationId) => {
    try {
      await markNotificationAsRead(memberId, notificationId);
      
      // Update local state to remove the read notification
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Mark notification as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Cache user data for AuthProvider to access
  useEffect(() => {
    if (dashboardData.data?.profile) {
      const cachedUserElement = document.getElementById('cached-member-user');
      if (cachedUserElement) {
        cachedUserElement.textContent = JSON.stringify(dashboardData.data.profile);
        cachedUserElement.setAttribute('data-user-id', dashboardData.data.profile._id);
      }
    }
  }, [dashboardData.data?.profile]);

  // Context value
  const value = {
    ...dashboardData,
    notifications,
    refreshNotifications,
    markNotificationRead,
    clearError: () => {}, // Keep for backward compatibility
    fetchMemberDashboardData: dashboardData.fetchDashboardData,
    refreshDashboard: dashboardData.fetchDashboardData,
  };

  return (
    <MemberDashboardContext.Provider value={value}>
      {children}
    </MemberDashboardContext.Provider>
  );
};

// Hook to use the context
export const useMemberDashboard = () => {
  const context = useContext(MemberDashboardContext);
  if (!context) {
    throw new Error('useMemberDashboard must be used within a MemberDashboardProvider');
  }
  return context;
};

export default MemberDashboardContext;
