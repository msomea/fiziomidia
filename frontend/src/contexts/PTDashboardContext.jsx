import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { usePTDashboard as usePTDashboardData } from '../hooks/usePTDashboard';
import { markNotificationRead, getNotifications } from '../api/notifications';
import { fetchPromotions } from '../api/promotions';
import { fetchPTById } from '../api/pts';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Context
const PTDashboardContext = createContext();

// Provider component
export const PTDashboardProvider = ({ children, ptId }) => {
  const [notifications, setNotifications] = useState([]);
  const dashboardData = usePTDashboardData(ptId);

  // Refresh notifications
  const refreshNotifications = useCallback(async (ptId) => {
    try {
      const notificationsData = await getNotifications();
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Notifications refresh error:', error);
      toast.error('Failed to refresh notifications');
    }
  }, []);

  // Mark notification as read
  const markNotificationReadHandler = useCallback(async (ptId, notificationId) => {
    try {
      await markNotificationRead(ptId, notificationId);
      
      // Update local state to remove the read notification
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Mark notification as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Cache user data for AuthProvider to access
  useEffect(() => {
    if (dashboardData.data?.ptProfile) {
      const cachedUserElement = document.getElementById('cached-pt-user');
      if (cachedUserElement) {
        cachedUserElement.textContent = JSON.stringify(dashboardData.data.ptProfile);
        cachedUserElement.setAttribute('data-user-id', dashboardData.data.ptProfile._id);
      }
    }
  }, [dashboardData.data?.ptProfile]);

  // Extract data properties for easier access
  const {
    data: dashboardInfo,
    loading,
    error,
    fetchDashboardData,
    refreshAppointments,
    refreshForumPosts,
    refreshPromotion,
    refreshStats
  } = dashboardData;

  // Context value
  const value = {
    // Extract individual properties from data
    ptProfile: dashboardInfo?.ptProfile,
    appointments: dashboardInfo?.appointments || [],
    forumPosts: dashboardInfo?.forumPosts || [],
    promotion: dashboardInfo?.promotion,
    stats: dashboardInfo?.stats || {},
    clinics: dashboardInfo?.clinics || [],
    clinicAppointments: dashboardInfo?.clinicAppointments || [],
    clinicPromotions: dashboardInfo?.clinicPromotions || [],
    ptRequests: dashboardInfo?.ptRequests || [],
    forumSubs: dashboardInfo?.forumSubs || [],
    // Include original data and functions
    data: dashboardInfo,
    loading,
    error,
    notifications,
    refreshNotifications,
    markNotificationRead: markNotificationReadHandler,
    clearError: () => {}, // Keep for backward compatibility
    fetchDashboardData: fetchDashboardData,
    refreshDashboard: fetchDashboardData,
    refreshAppointments,
    refreshForumPosts,
    refreshPromotion,
    refreshStats,
    refreshPTProfile: () => {} // Simplified for now
  };

  return (
    <PTDashboardContext.Provider value={value}>
      {children}
    </PTDashboardContext.Provider>
  );
};

// Hook to use the context
export const usePTDashboard = () => {
  const context = useContext(PTDashboardContext);
  if (!context) {
    throw new Error('usePTDashboard must be used within a PTDashboardProvider');
  }
  return context;
};

export default PTDashboardContext;
