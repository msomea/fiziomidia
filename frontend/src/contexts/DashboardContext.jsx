import React, { createContext, useContext } from 'react';
import { useDashboardData } from '../hooks/useDashboard';
import toast from 'react-hot-toast';

// Context
const DashboardContext = createContext();

// Provider component
export const DashboardProvider = ({ children }) => {
  const dashboardData = useDashboardData();

  // Context value
  const value = {
    ...dashboardData,
    clearError: () => {}, // Keep for backward compatibility
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
