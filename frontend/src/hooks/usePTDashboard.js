import { useState, useCallback } from 'react';
import { useApiData } from './useApiData';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import { fetchPTDashboardData, fetchPTDashboardStats } from '../api/pts';
import { getUserNotifications } from '../api/notifications';

/**
 * Hook for PT dashboard data management
 */
export const usePTDashboard = (ptId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all PT dashboard data at once
  const fetchDashboardData = useCallback(async () => {
    if (!ptId) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetchPTDashboardData(ptId);
      
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      toast.error('Failed to load dashboard data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ptId]);

  // Refresh specific data sections
  const refreshAppointments = useCallback(async (ptId, limit = 3) => {
    try {
      const response = await API.get(`${API_URL}/appointments?ptId=${ptId}&limit=${limit}`);
      setData(prev => ({ ...prev, appointments: response.data.appointments || [] }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh appointments');
      throw error;
    }
  }, []);

  const refreshForumPosts = useCallback(async (ptId, limit = 3) => {
    try {
      const response = await API.get(`${API_URL}/forum?ptId=${ptId}&limit=${limit}`);
      setData(prev => ({ ...prev, forumPosts: response.data.posts || [] }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh forum posts');
      throw error;
    }
  }, []);

  const refreshPromotion = useCallback(async (ptId) => {
    try {
      const response = await API.get(`${API_URL}/promotions/pt`, { 
        params: { ptId }
      });
      setData(prev => ({ ...prev, promotion: response.data }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh promotion');
      throw error;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (!ptId) return;
    
    try {
      const response = await fetchPTDashboardStats(ptId);
      setData(prev => ({ ...prev, stats: response.data }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh stats');
      throw error;
    }
  }, [ptId]);

  return {
    data,
    loading,
    error,
    fetchDashboardData,
    refreshAppointments,
    refreshForumPosts,
    refreshPromotion,
    refreshStats
  };
};
