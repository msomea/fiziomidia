import React, { createContext, useContext, useReducer, useCallback } from 'react';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  ptProfile: null,
  appointments: [],
  forumPosts: [],
  promotion: null,
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
  const fetchPTDashboardData = useCallback(async (ptId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });

      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await API.get(`${API_URL}/pts/${ptId}/dashboard`, { headers });
      
      dispatch({
        type: actionTypes.SET_DASHBOARD_DATA,
        payload: response.data,
      });

      return response.data;
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
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await API.get(`${API_URL}/pts/${ptId}`, { headers });
      dispatch({ type: actionTypes.UPDATE_PT_PROFILE, payload: response.data });
    } catch (error) {
      console.error('PT profile refresh error:', error);
      toast.error('Failed to refresh PT profile');
    }
  }, []);

  const refreshAppointments = useCallback(async (ptId, limit = 3) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await API.get(`${API_URL}/appointments?ptId=${ptId}&limit=${limit}`, { headers });
      dispatch({ type: actionTypes.UPDATE_APPOINTMENTS, payload: response.data.appointments || [] });
    } catch (error) {
      console.error('Appointments refresh error:', error);
      toast.error('Failed to refresh appointments');
    }
  }, []);

  const refreshForumPosts = useCallback(async (ptId, limit = 3) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await API.get(`${API_URL}/forum?ptId=${ptId}&limit=${limit}`, { headers });
      dispatch({ type: actionTypes.UPDATE_FORUM_POSTS, payload: response.data.posts || [] });
    } catch (error) {
      console.error('Forum posts refresh error:', error);
      toast.error('Failed to refresh forum posts');
    }
  }, []);

  const refreshPromotion = useCallback(async (ptId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await API.get(`${API_URL}/promotions?ptId=${ptId}`, { headers });
      dispatch({ type: actionTypes.UPDATE_PROMOTION, payload: response.data || null });
    } catch (error) {
      console.error('Promotion refresh error:', error);
      toast.error('Failed to refresh promotion');
    }
  }, []);

  const refreshStats = useCallback(async (ptId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await API.get(`${API_URL}/pts/${ptId}/dashboard-stats`, { headers });
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

  // Context value
  const value = {
    ...state,
    fetchPTDashboardData,
    refreshPTProfile,
    refreshAppointments,
    refreshForumPosts,
    refreshPromotion,
    refreshStats,
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
