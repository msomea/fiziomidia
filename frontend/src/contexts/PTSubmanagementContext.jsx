import React, { createContext, useContext, useState, useCallback } from "react";
import API from "../api/axios";
import { API_URL } from "../config/constants";
import { toast } from "react-hot-toast";

const PTSubmanagementContext = createContext();

export const PTSubmanagementProvider = ({ children }) => {
  const [subforum, setSubforum] = useState(null);
  const [modRequests, setModRequests] = useState([]);
  const [userPermissions, setUserPermissions] = useState({
    isOwner: false,
    isMod: false,
    hasPendingRequest: false,
    canEdit: false,
    canManageRequests: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [canManage, setCanManage] = useState(false);

  // 🚀 Consolidated fetch for PT submanagement data
  const fetchSubmanagementData = useCallback(async (subId, options = {}) => {
    if (!subId) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        status: options.status || activeTab || "pending",
      });

      const res = await API.get(`${API_URL}/forum/subs/${subId}/management?${params}`);
      const data = res.data;

      if (data.success) {
        setSubforum(data.subforum);
        setModRequests(data.modRequests || []);
        setUserPermissions(data.userPermissions || {});
        setCanManage(data.canManage || false);
        return data;
      }
    } catch (err) {
      console.error("Error fetching submanagement data:", err);
      toast.error(err.response?.data?.message || "Failed to load subforum data");
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Refresh mod requests only (for tab switching)
  const refreshModRequests = useCallback(async (subId, status) => {
    if (!subId) return;

    try {
      setLoading(true);

      const res = await API.get(`${API_URL}/forum/subs/${subId}/mod-requests?status=${status}`);
      setModRequests(res.data.requests || []);
      
      return res.data;
    } catch (err) {
      console.error("Error refreshing mod requests:", err);
      toast.error("Failed to refresh moderator requests");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update subforum details
  const updateSubforum = useCallback(async (subId, updateData) => {
    try {
      const res = await API.put(`${API_URL}/forum/subs/${subId}`, updateData);
      
      if (res.data.success) {
        setSubforum(res.data.sub);
        toast.success("Subforum updated successfully");
        return res.data.sub;
      }
    } catch (err) {
      console.error("Error updating subforum:", err);
      toast.error(err.response?.data?.message || "Failed to update subforum");
      return null;
    }
  }, []);

  // Update mod request role
  const updateModRequest = useCallback(async (subId, requestId, role) => {
    try {
      await API.patch(
        `${API_URL}/forum/subs/${subId}/mod-requests/${requestId}`,
        { role }
      );

      toast.success("Role updated successfully");
      
      // Refresh both subforum data and requests
      await Promise.all([
        fetchSubmanagementData(subId),
        refreshModRequests(subId, activeTab)
      ]);
      
      return true;
    } catch (err) {
      console.error("Error updating mod request:", err);
      toast.error("Failed to update role");
      return false;
    }
  }, [fetchSubmanagementData, refreshModRequests, activeTab]);

  // Handle tab change
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
  }, []);

  // Reset state when navigating away
  const resetState = useCallback(() => {
    setSubforum(null);
    setModRequests([]);
    setUserPermissions({
      isOwner: false,
      isMod: false,
      hasPendingRequest: false,
      canEdit: false,
      canManageRequests: false
    });
    setCanManage(false);
    setActiveTab("pending");
  }, []);

  return (
    <PTSubmanagementContext.Provider
      value={{
        // State
        subforum,
        modRequests,
        userPermissions,
        loading,
        activeTab,
        canManage,
        
        // Actions
        fetchSubmanagementData,
        refreshModRequests,
        updateSubforum,
        updateModRequest,
        handleTabChange,
        resetState,
        setActiveTab,
      }}
    >
      {children}
    </PTSubmanagementContext.Provider>
  );
};

export const usePTSubmanagement = () => useContext(PTSubmanagementContext);
