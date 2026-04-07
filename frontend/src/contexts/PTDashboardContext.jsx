import React, { createContext, useContext, useReducer, useCallback } from 'react';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import { getUserNotifications, markNotificationAsRead } from '../api/notifications';
import { fetchPromotions } from '../api/promotions';
import { fetchPTDashboardData, fetchPTDashboardStats, fetchPTById } from '../api/pts';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  ptProfile: null,
  clinics: [], // NEW - Add clinics to state
  appointments: [],
  forumPosts: [],
  promotion: null,
  notifications: [],
  stats: {
    totalAppointments: 0,
    pendingRequests: 0,
    totalForumPosts: 0,
    promotionDaysLeft: 0,
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
  UPDATE_PT_PROFILE: 'UPDATE_PT_PROFILE',
  UPDATE_APPOINTMENTS: 'UPDATE_APPOINTMENTS',
  UPDATE_FORUM_POSTS: 'UPDATE_FORUM_POSTS',
  UPDATE_PROMOTION: 'UPDATE_PROMOTION',
  UPDATE_STATS: 'UPDATE_STATS',
  UPDATE_NOTIFICATIONS: 'UPDATE_NOTIFICATIONS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const ptDashboardReducer = (state, action) => {
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
    case actionTypes.UPDATE_PT_PROFILE:
      return { ...state, ptProfile: action.payload };
    case actionTypes.UPDATE_APPOINTMENTS:
      return { ...state, appointments: action.payload };
    case actionTypes.UPDATE_FORUM_POSTS:
      return { ...state, forumPosts: action.payload };
    case actionTypes.UPDATE_PROMOTION:
      return { ...state, promotion: action.payload };
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
const PTDashboardContext = createContext();

// Provider component
export const PTDashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ptDashboardReducer, initialState);

  // Fetch all PT dashboard data at once
  const fetchDashboardData = useCallback(async (ptId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });

      let dashboardData = await fetchPTDashboardData(ptId);
      
      // Use backend-calculated days left, no need to recalculate
      if (dashboardData.promotion && dashboardData.promotion.status === 'active' && dashboardData.promotion.endAt) {
        // Use the days left from stats if available, otherwise calculate as fallback
        const daysLeft = dashboardData.stats?.promotionDaysLeft || 0;
        
        dashboardData = {
          ...dashboardData,
          promotion: {
            ...dashboardData.promotion,
            daysLeft: Math.max(0, daysLeft)
          }
        };
      }
      
      dispatch({
        type: actionTypes.SET_DASHBOARD_DATA,
        payload: dashboardData,
      });

      // Also fetch notifications separately
      try {
        const notifications = await getUserNotifications(ptId);
        dispatch({ 
          type: actionTypes.UPDATE_NOTIFICATIONS, 
          payload: notifications || [] 
        });
      } catch (notifError) {
        console.error('Notifications fetch error:', notifError);
        // Don't show toast for this, as it's not critical
      }

      return dashboardData;
    } catch (error) {
      console.error('PT Dashboard data fetch error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load PT dashboard data';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Refresh specific data sections
  const refreshPTProfile = useCallback(async (ptId) => {
    try {
      const ptProfile = await fetchPTById(ptId);
      dispatch({ type: actionTypes.UPDATE_PT_PROFILE, payload: ptProfile });
    } catch (error) {
      console.error('PT profile refresh error:', error);
      toast.error('Failed to refresh PT profile');
    }
  }, []);

  const refreshAppointments = useCallback(async (ptId, limit = 3) => {
    try {
      // TODO: Move to centralized API when appointments API is created
      const response = await API.get(`${API_URL}/appointments?ptId=${ptId}&limit=${limit}`);
      dispatch({ type: actionTypes.UPDATE_APPOINTMENTS, payload: response.data.appointments || [] });
    } catch (error) {
      console.error('Appointments refresh error:', error);
      toast.error('Failed to refresh appointments');
    }
  }, []);

  const refreshForumPosts = useCallback(async (ptId, limit = 3) => {
    try {
      // TODO: Move to centralized API when forum API is created
      const response = await API.get(`${API_URL}/forum?ptId=${ptId}&limit=${limit}`);
      dispatch({ type: actionTypes.UPDATE_FORUM_POSTS, payload: response.data.posts || [] });
    } catch (error) {
      console.error('Forum posts refresh error:', error);
      toast.error('Failed to refresh forum posts');
    }
  }, []);

  const refreshPromotion = useCallback(async (ptId) => {
    try {
      // TODO: Move to centralized API when promotion API is updated
      const response = await API.get(`${API_URL}/promotions/pt`, { 
        params: { ptId }
      });
      
      let promotionData = response.data || null;
      
      // Use backend-calculated days left, no need to recalculate
      if (promotionData && promotionData.status === 'active' && promotionData.endAt) {
        // For individual promotion refresh, we need to calculate since we don't have stats
        // But use a more reliable method
        const endDate = new Date(promotionData.endAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for consistent calculation
        endDate.setHours(0, 0, 0, 0); // Set to start of day for consistent calculation
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        console.log("days left in refresh promotion:", daysLeft)
        
        promotionData = {
          ...promotionData,
          daysLeft: Math.max(0, daysLeft)
        };
      }
      
      dispatch({ type: actionTypes.UPDATE_PROMOTION, payload: promotionData });
    } catch (error) {
      console.error('Promotion refresh error:', error);
      toast.error('Failed to refresh promotion');
    }
  }, []);

  const refreshStats = useCallback(async (ptId) => {
    try {
      const stats = await fetchPTDashboardStats(ptId);
      dispatch({ type: actionTypes.UPDATE_STATS, payload: stats || {} });
      console.log("Stat is dash context", stats)
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
  const refreshNotifications = useCallback(async (ptId) => {
    try {
      const notifications = await getUserNotifications(ptId);
      dispatch({ type: actionTypes.UPDATE_NOTIFICATIONS, payload: notifications || [] });
    } catch (error) {
      console.error('Notifications refresh error:', error);
      toast.error('Failed to refresh notifications');
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (ptId, notificationId) => {
    try {
      await markNotificationAsRead(ptId, notificationId);
      
      // Update local state to remove read notification (it will be deleted from backend)
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
    fetchPTDashboardData: fetchDashboardData,
    refreshPTProfile,
    refreshAppointments,
    refreshForumPosts,
    refreshPromotion,
    refreshStats,
    refreshNotifications,
    markNotificationRead,
    clearError,
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
