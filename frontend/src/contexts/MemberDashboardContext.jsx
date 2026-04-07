import React, { createContext, useContext, useReducer, useCallback } from 'react';
import API from '../api/axios';
import { getUserNotifications, markNotificationAsRead } from '../api/notifications';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  memberProfile: null,
  appointments: [],
  savedPTs: [],
  notifications: [],
  stats: {
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    savedPTsCount: 0,
  },
  loading: false,
  error: null,
  lastFetched: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  UPDATE_MEMBER_PROFILE: 'UPDATE_MEMBER_PROFILE',
  UPDATE_APPOINTMENTS: 'UPDATE_APPOINTMENTS',
  UPDATE_SAVED_PTS: 'UPDATE_SAVED_PTS',
  UPDATE_STATS: 'UPDATE_STATS',
  UPDATE_NOTIFICATIONS: 'UPDATE_NOTIFICATIONS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const memberDashboardReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actionTypes.SET_DASHBOARD_DATA:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        lastFetched: new Date(),
      };
    case actionTypes.UPDATE_MEMBER_PROFILE:
      return { ...state, memberProfile: action.payload };
    case actionTypes.UPDATE_APPOINTMENTS:
      return { ...state, appointments: action.payload };
    case actionTypes.UPDATE_SAVED_PTS:
      return { ...state, savedPTs: action.payload };
    case actionTypes.UPDATE_STATS:
      return { ...state, stats: action.payload };
    case actionTypes.UPDATE_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const MemberDashboardContext = createContext();

// Provider component
export const MemberDashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(memberDashboardReducer, initialState);

  // Fetch all member dashboard data at once
  const fetchMemberDashboardData = useCallback(async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });

      const response = await API.get(`${API_URL}/users/dashboard`);
      
      dispatch({
        type: actionTypes.SET_DASHBOARD_DATA,
        payload: response.data,
      });

      // Also fetch notifications separately
      try {
        const notifications = await getUserNotifications(response.data.memberProfile?._id);
        dispatch({ 
          type: actionTypes.UPDATE_NOTIFICATIONS, 
          payload: notifications || [] 
        });
      } catch (notifError) {
        console.error('Notifications fetch error:', notifError);
        // Don't show toast for this, as it's not critical
      }

      return response.data;
    } catch (error) {
      console.error('Member Dashboard data fetch error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load member dashboard data';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Refresh specific data sections
  const refreshMemberProfile = useCallback(async () => {
    try {
      const response = await API.get(`${API_URL}/users/profile`);
      
      // Add timestamp to profile image URL to prevent caching
      const fullUserData = response.data;
      const timestamp = new Date().getTime();
      if (fullUserData.profileImageUrl) {
        fullUserData.profileImageUrl = fullUserData.profileImageUrl.includes("?")
          ? `${fullUserData.profileImageUrl}&t=${timestamp}`
          : `${fullUserData.profileImageUrl}?t=${timestamp}`;
      }
      
      dispatch({ type: actionTypes.UPDATE_MEMBER_PROFILE, payload: fullUserData });
    } catch (error) {
      console.error('Member profile refresh error:', error);
      toast.error('Failed to refresh profile');
    }
  }, []);

  const refreshAppointments = useCallback(async (memberId) => {
    try {
      const response = await API.get(`${API_URL}/appointments/member/${memberId}`);
      dispatch({ type: actionTypes.UPDATE_APPOINTMENTS, payload: response.data || [] });
    } catch (error) {
      console.error('Appointments refresh error:', error);
      toast.error('Failed to refresh appointments');
    }
  }, []);

  const refreshSavedPTs = useCallback(async (memberId) => {
    try {
      const response = await API.get(`${API_URL}/users/${memberId}/saved-pts`);
      dispatch({ type: actionTypes.UPDATE_SAVED_PTS, payload: response.data || [] });
    } catch (error) {
      console.error('Saved PTs refresh error:', error);
      toast.error('Failed to refresh saved PTs');
    }
  }, []);

  const refreshStats = useCallback(async (memberId) => {
    try {
      const response = await API.get(`${API_URL}/users/${memberId}/dashboard-stats`);
      dispatch({ type: actionTypes.UPDATE_STATS, payload: response.data || {} });
    } catch (error) {
      console.error('Stats refresh error:', error);
      toast.error('Failed to refresh stats');
    }
  }, []);

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Refresh notifications
  const refreshNotifications = useCallback(async (memberId) => {
    try {
      const notifications = await getUserNotifications(memberId);
      dispatch({ type: actionTypes.UPDATE_NOTIFICATIONS, payload: notifications || [] });
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
      dispatch({ 
        type: actionTypes.UPDATE_NOTIFICATIONS, 
        payload: state.notifications.filter(n => n._id !== notificationId)
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [state.notifications]);

  // Context value
  const value = {
    ...state,
    fetchMemberDashboardData,
    refreshMemberProfile,
    refreshAppointments,
    refreshSavedPTs,
    refreshStats,
    refreshNotifications,
    markNotificationRead,
    clearError,
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
