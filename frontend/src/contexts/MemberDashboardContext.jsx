import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useMemberDashboard as useMemberDashboardData } from '../hooks/useMemberDashboard';
import { markNotificationRead } from '../api/notifications';
import toast from 'react-hot-toast';

// Context
const MemberDashboardContext = createContext();

// Provider component
export const MemberDashboardProvider = ({ children }) => {
  const dashboardData = useMemberDashboardData();

  // Mark notification as read
  const markNotificationReadHandler = useCallback(async (memberId, notificationId) => {
    try {
      await markNotificationRead(memberId, notificationId);
      
      // The backend will handle deletion, we need to trigger a refresh
      // to get the updated notifications list
      if (memberId) {
        dashboardData.refreshDashboard();
      }
    } catch (error) {
      console.error('Mark notification as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [dashboardData]);

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

  // Extract data properties for easier access
  const {
    data: dashboardInfo,
    loading,
    error,
    fetchDashboardData,
    refreshMemberProfile,
    refreshAppointments,
    refreshSavedPTs,
    refreshStats
  } = dashboardData;

  // Extract notifications from backend response properly
  const notificationsFromBackend = dashboardInfo?.notifications || [];

  // Context value
  const value = {
    // Extract individual properties from data
    memberProfile: dashboardInfo?.profile,
    appointments: dashboardInfo?.appointments || [],
    savedPTs: dashboardInfo?.savedPTs || [],
    clinicAppointments: dashboardInfo?.clinicAppointments || [],
    clinics: dashboardInfo?.clinics || [],
    clinicPromotions: dashboardInfo?.clinicPromotions || [],
    stats: dashboardInfo?.stats || {},
    // Include original data and functions
    data: dashboardInfo,
    loading,
    error,
    notifications: notificationsFromBackend, // Directly use backend notifications
    markNotificationRead: markNotificationReadHandler,
    clearError: () => {}, // Keep for backward compatibility
    fetchMemberDashboardData: fetchDashboardData,
    refreshDashboard: fetchDashboardData,
    refreshMemberProfile,
    refreshAppointments,
    refreshSavedPTs,
    refreshStats
  };

  return (
    <MemberDashboardContext.Provider value={value}>
      {children}
    </MemberDashboardContext.Provider>
  );
};

// Hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useMemberDashboard = () => {
  const context = useContext(MemberDashboardContext);
  if (!context) {
    throw new Error('useMemberDashboard must be used within a MemberDashboardProvider');
  }
  return context;
};

export default MemberDashboardContext;
