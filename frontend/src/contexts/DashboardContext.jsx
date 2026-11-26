import React, { createContext, useContext } from 'react';
import { useDashboardData } from '../hooks/useDashboard';

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
// eslint-disable-next-line react-refresh/only-export-components
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;
