import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Generic hook for fetching data with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useApiData = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError,
    showToast = false,
  } = options;

  const fetchData = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      
      if (onSuccess) onSuccess(result);
      if (showToast) toast.success('Data loaded successfully');
      
      return result;
    } catch (err) {
      setError(err);
      if (onError) onError(err);
      if (showToast) toast.error(err.message || 'Failed to load data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError, showToast]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for paginated data fetching
 * @param {Function} apiFunction - The API function that accepts pagination params
 * @param {Object} initialParams - Initial pagination parameters
 * @returns {Object} - Pagination state and controls
 */
export const usePaginatedData = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
    ...initialParams
  });

  const fetchPage = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction({ ...pagination, ...params });
      
      if (result.data) {
        setData(result.data);
      }
      if (result.pagination) {
        setPagination(prev => ({ ...prev, ...result.pagination }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Failed to load data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, pagination]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchPage({ page: pagination.page + 1 });
    }
  }, [pagination.page, pagination.totalPages, fetchPage]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchPage({ page: pagination.page - 1 });
    }
  }, [pagination.page, fetchPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPage({ page });
    }
  }, [pagination.totalPages, fetchPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchPage,
    nextPage,
    prevPage,
    goToPage
  };
};

/**
 * Hook for CRUD operations with optimistic updates
 * @param {Object} crudFunctions - Object containing create, update, delete functions
 * @returns {Object} - CRUD operation handlers
 */
export const useCrudOperations = (crudFunctions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeOperation = useCallback(async (operation, ...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await crudFunctions[operation](...args);
      
      toast.success(`${operation} completed successfully`);
      return result;
    } catch (err) {
      setError(err);
      toast.error(err.message || `Failed to ${operation}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [crudFunctions]);

  const create = useCallback((...args) => executeOperation('create', ...args), [executeOperation]);
  const update = useCallback((...args) => executeOperation('update', ...args), [executeOperation]);
  const remove = useCallback((...args) => executeOperation('delete', ...args), [executeOperation]);

  return { create, update, remove, loading, error };
};
