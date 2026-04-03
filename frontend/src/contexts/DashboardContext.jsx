import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  users: [],
  appointments: [],
  promotions: [],
  forumSubs: [],
  sponsoredProducts: [],
  modRequests: [],
  adminStats: null,
  activityLogs: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  UPDATE_USERS: 'UPDATE_USERS',
  UPDATE_APPOINTMENTS: 'UPDATE_APPOINTMENTS',
  UPDATE_PROMOTIONS: 'UPDATE_PROMOTIONS',
  UPDATE_FORUM_SUBS: 'UPDATE_FORUM_SUBS',
  UPDATE_SPONSORED_PRODUCTS: 'UPDATE_SPONSORED_PRODUCTS',
  UPDATE_MOD_REQUESTS: 'UPDATE_MOD_REQUESTS',
  UPDATE_ADMIN_STATS: 'UPDATE_ADMIN_STATS',
  UPDATE_ACTIVITY_LOGS: 'UPDATE_ACTIVITY_LOGS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const dashboardReducer = (state, action) => {
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
    case actionTypes.UPDATE_USERS:
      return { ...state, users: action.payload };
    case actionTypes.UPDATE_APPOINTMENTS:
      return { ...state, appointments: action.payload };
    case actionTypes.UPDATE_PROMOTIONS:
      return { ...state, promotions: action.payload };
    case actionTypes.UPDATE_FORUM_SUBS:
      return { ...state, forumSubs: action.payload };
    case actionTypes.UPDATE_SPONSORED_PRODUCTS:
      return { ...state, sponsoredProducts: action.payload };
    case actionTypes.UPDATE_MOD_REQUESTS:
      return { ...state, modRequests: action.payload };
    case actionTypes.UPDATE_ADMIN_STATS:
      return { ...state, adminStats: action.payload };
    case actionTypes.UPDATE_ACTIVITY_LOGS:
      return { ...state, activityLogs: action.payload };
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const DashboardContext = createContext();

// Provider component
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Fetch all dashboard data at once
  const fetchDashboardData = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });

      const response = await API.get(`${API_URL}/admin/dashboard`, { params: filters });
      
      dispatch({
        type: actionTypes.SET_DASHBOARD_DATA,
        payload: response.data,
      });

      return response.data;
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Refresh specific data sections
  const refreshUsers = async (filters = {}) => {
    try {
      const response = await API.get(`${API_URL}/admin/users`, { params: filters });
      dispatch({ type: actionTypes.UPDATE_USERS, payload: response.data.users || [] });
      return response.data;
    } catch (error) {
      console.error('Users refresh error:', error);
      toast.error('Failed to refresh users');
    }
  };

  const refreshAppointments = async (filters = {}) => {
    try {
      const response = await API.get(`${API_URL}/admin/appointments`, { params: filters });
      dispatch({ type: actionTypes.UPDATE_APPOINTMENTS, payload: response.data.appts || [] });
      return response.data;
    } catch (error) {
      console.error('Appointments refresh error:', error);
      toast.error('Failed to refresh appointments');
    }
  };

  const refreshPromotions = async (filters = {}) => {
    try {
      const response = await API.get(`${API_URL}/admin/promotions`, { params: filters });
      dispatch({ type: actionTypes.UPDATE_PROMOTIONS, payload: response.data.promotions || [] });
      return response.data;
    } catch (error) {
      console.error('Promotions refresh error:', error);
      toast.error('Failed to refresh promotions');
    }
  };

  const refreshSponsoredProducts = async (filters = {}) => {
    try {
      const response = await API.get(`${API_URL}/admin/sponsored-products`, { params: filters });
      dispatch({ type: actionTypes.UPDATE_SPONSORED_PRODUCTS, payload: response.data.products || [] });
      return response.data; // Return response data for pagination
    } catch (error) {
      console.error('Products refresh error:', error);
      toast.error('Failed to refresh products');
    }
  };

  const refreshModRequests = async (filters = {}) => {
    try {
      const response = await API.get(`${API_URL}/admin/forum/mod-requests`, { params: filters });
      dispatch({ type: actionTypes.UPDATE_MOD_REQUESTS, payload: response.data.modRequests || [] });
      return response.data;
    } catch (error) {
      console.error('Mod requests refresh error:', error);
      toast.error('Failed to refresh moderator requests');
    }
  };

  const refreshAdminStats = async () => {
    try {
      const response = await API.get(`${API_URL}/admin/monitoring/stats`);
      dispatch({ type: actionTypes.UPDATE_ADMIN_STATS, payload: response.data });
    } catch (error) {
      console.error('Admin stats refresh error:', error);
      toast.error('Failed to refresh admin stats');
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    fetchDashboardData,
    refreshUsers,
    refreshAppointments,
    refreshPromotions,
    refreshSponsoredProducts,
    refreshModRequests,
    refreshAdminStats,
    clearError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook to use the context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;
