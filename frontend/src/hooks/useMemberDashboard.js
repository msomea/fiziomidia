import { useState, useCallback } from 'react';
import { useApiData } from './useApiData';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import { getProfile, getAppointmentsByMember } from "../api/users";

/**
 * Hook for member dashboard data management
 */
export const useMemberDashboard = (memberId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all member dashboard data at once
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get(
        `${API_URL}/users/dashboard${forceRefresh ? "?forceRefresh=true" : ""}`,
      );

      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      toast.error("Failed to load dashboard data");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data sections
  const refreshMemberProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      
      // Add timestamp to profile image URL to prevent caching
      const fullUserData = response;
      if (fullUserData.avatar) {
        fullUserData.avatar = `${fullUserData.avatar}?t=${Date.now()}`;
      }
      
      setData(prev => ({ ...prev, profile: fullUserData }));
      return fullUserData;
    } catch (err) {
      toast.error('Failed to refresh profile');
      throw err;
    }
  }, []);

  const refreshAppointments = useCallback(async (memberId) => {
    try {
      const response = await getAppointmentsByMember(memberId);
      setData(prev => ({ ...prev, appointments: response.data || [] }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh appointments');
      throw error;
    }
  }, []);

  const refreshSavedPTs = useCallback(async (memberId) => {
    try {
      const response = await API.get(`${API_URL}/users/${memberId}/saved-pts`);
      setData(prev => ({ ...prev, savedPTs: response.data || [] }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh saved PTs');
      throw error;
    }
  }, []);

  const refreshStats = useCallback(async (memberId) => {
    try {
      const response = await API.get(`${API_URL}/users/${memberId}/dashboard-stats`);
      setData(prev => ({ ...prev, stats: response.data || {} }));
      return response;
    } catch (error) {
      toast.error('Failed to refresh stats');
      throw error;
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchDashboardData,
    refreshMemberProfile,
    refreshAppointments,
    refreshSavedPTs,
    refreshStats
  };
};
