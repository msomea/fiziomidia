import { useState, useEffect, useCallback } from "react";
import { fetchResources } from "../api/education";

// Hook for paginated, filterable resource library data.
export function useEducationResources(initialParams = {}) {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const load = useCallback(async (query = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResources(query);
      setResources(res.data.resources || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load(params);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return { resources, pagination, loading, error, params, updateParams, goToPage, reload: () => load(params) };
}
