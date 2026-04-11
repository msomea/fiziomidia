import { useState, useCallback } from 'react';
import { useApiData } from './useApiData';
import toast from 'react-hot-toast';
import { 
  fetchAllUsers, 
  fetchAdminAppointments, 
  fetchAdminPromotions,
  getSponsoredProducts,
  getAdminStats,
  fetchAdminPromotions as fetchClinicPromotions
} from '../api/admin';
import { fetchForumSubs } from '../api/forum';

/**
 * Hook for admin dashboard data management
 */
export const useDashboardData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all dashboard data at once
  const fetchDashboardData = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // This would ideally be a single API call, but for now we'll use existing pattern
      const [
        usersData,
        appointmentsData, 
        promotionsData,
        forumSubsData,
        sponsoredProductsData,
        adminStatsData,
        clinicPromotionsData
      ] = await Promise.all([
        fetchAllUsers().catch(() => ({ users: [] })),
        fetchAdminAppointments().catch(() => ({ appts: [] })),
        fetchAdminPromotions().catch(() => ({ promotions: [] })),
        fetchForumSubs().catch(() => ({ subs: [] })),
        getSponsoredProducts({ page: 1, limit: 10 }).catch(() => ({ products: [] })),
        getAdminStats().catch(() => null),
        fetchClinicPromotions().catch(() => [])
      ]);

      const dashboardData = {
        users: usersData.users || [],
        appointments: appointmentsData.appts || [],
        promotions: promotionsData.promotions || [],
        forumSubs: forumSubsData.subs || [],
        sponsoredProducts: sponsoredProductsData.products || [],
        adminStats: adminStatsData,
        clinicPromotions: clinicPromotionsData || [],
        lastFetched: new Date()
      };

      setData(dashboardData);
      return dashboardData;
    } catch (err) {
      setError(err);
      toast.error('Failed to load dashboard data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data sections
  const refreshUsers = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAllUsers();
      setData(prev => ({ ...prev, users: result.users || [] }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh users');
      throw err;
    }
  }, []);

  const refreshAppointments = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAdminAppointments();
      setData(prev => ({ ...prev, appointments: result.appts || [] }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh appointments');
      throw err;
    }
  }, []);

  const refreshPromotions = useCallback(async (filters = {}) => {
    try {
      const result = await fetchAdminPromotions();
      setData(prev => ({ ...prev, promotions: result.promotions || [] }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh promotions');
      throw err;
    }
  }, []);

  const refreshSponsoredProducts = useCallback(async (filters = {}) => {
    try {
      const result = await getSponsoredProducts(filters);
      setData(prev => ({ ...prev, sponsoredProducts: result.products || [] }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh sponsored products');
      throw err;
    }
  }, []);

  const refreshAdminStats = useCallback(async () => {
    try {
      const result = await getAdminStats();
      setData(prev => ({ ...prev, adminStats: result }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh admin stats');
      throw err;
    }
  }, []);

  const refreshClinicPromotions = useCallback(async (filters = {}) => {
    try {
      const result = await fetchClinicPromotions();
      setData(prev => ({ ...prev, clinicPromotions: result || [] }));
      return result;
    } catch (err) {
      toast.error('Failed to refresh clinic promotions');
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
    refreshClinicPromotions
  };
};
