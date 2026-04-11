import { useState, useCallback } from 'react';
import { useApiData } from './useApiData';
import toast from 'react-hot-toast';
import {
  fetchDashboardData as fetchDashboardDataAPI,
  fetchAllUsers,
  fetchAdminAppointments,
  fetchAdminPTPromotions,
  getSponsoredProducts,
  getAdminStats,
  fetchClinicPromotions,
  getAdminActivityLogs,
  getForumModRequests,
} from "../api/admin";
import { fetchForumSubs } from '../api/forum';

/**
 * Hook for admin dashboard data management
 */
export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all dashboard data at once using consolidated API
  const fetchDashboardData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Use the consolidated dashboard API
      const dashboardData = await fetchDashboardDataAPI(filters);

      setData(dashboardData);
      return dashboardData;
    } catch (err) {
      setError(err);
      toast.error("Failed to load dashboard data");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data sections
  const refreshUsers = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAllUsers(filters);
      setData((prev) => ({ ...prev, users: result.users || [] }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh users");
      throw err;
    }
  }, []);

  const refreshAppointments = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAdminAppointments(filters);
      console.log("API response from fetchAdminAppointments:", result);
      setData((prev) => ({ ...prev, appointments: result.appts || [] }));
      return result;
    } catch (err) {
      console.error("Error in refreshAppointments:", err);
      toast.error("Failed to refresh appointments");
      throw err;
    }
  }, []);

  const refreshPromotions = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAdminPTPromotions(filters);
      setData((prev) => ({ ...prev, promotions: result.promotions || [] }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh promotions");
      throw err;
    }
  }, []);

  const refreshSponsoredProducts = useCallback(async (filters = {}) => {
    try {
      const result = await getSponsoredProducts(filters);
      setData((prev) => ({
        ...prev,
        sponsoredProducts: result.products || [],
      }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh sponsored products");
      throw err;
    }
  }, []);

  const refreshAdminStats = useCallback(async () => {
    try {
      const result = await getAdminStats();
      setData((prev) => ({ ...prev, adminStats: result }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh admin stats");
      throw err;
    }
  }, []);

  const refreshClinicPromotions = useCallback(async (filters = {}) => {
    try {
      const result = await fetchClinicPromotions(filters);
      setData((prev) => ({ ...prev, clinicPromotions: result || [] }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh clinic promotions");
      throw err;
    }
  }, []);

  const refreshActivityLogs = useCallback(async (params = {}) => {
    try {
      const result = await getAdminActivityLogs(params);
      setData((prev) => ({ ...prev, activityLogs: result.logs || [] }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh activity logs");
      throw err;
    }
  }, []);

  const refreshModRequests = useCallback(async (params = {}) => {
    try {
      const result = await getForumModRequests(params);
      setData((prev) => ({ ...prev, modRequests: result.modRequests || [] }));
      return result;
    } catch (err) {
      toast.error("Failed to refresh mod requests");
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchDashboardData,
    refreshUsers,
    refreshAppointments,
    refreshPromotions,
    refreshSponsoredProducts,
    refreshAdminStats,
    refreshClinicPromotions,
    refreshActivityLogs,
    refreshModRequests,
    // Direct access to data properties for convenience
    users: data?.users || [],
    appointments: data?.appointments || [],
    promotions: data?.promotions || [],
    forumSubs: data?.forumSubs || [],
    sponsoredProducts: data?.sponsoredProducts || [],
    adminStats: data?.adminStats,
    clinicPromotions: data?.clinicPromotions || [],
    activityLogs: data?.activityLogs || [],
    modRequests: data?.modRequests || [],
  };
};;
