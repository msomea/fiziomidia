import React, { createContext, useContext, useReducer, useCallback } from 'react';
import API from '../api/axios';
import { API_URL } from '../config/constants';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  ptPromotions: [],
  clinicPromotions: [],
  sponsoredProducts: [],
  lastFetched: null,
};

// Action types
const actionTypes = {
  SET_HOME_PAGE_DATA: 'SET_HOME_PAGE_DATA',
  UPDATE_PT_PROMOTIONS: 'UPDATE_PT_PROMOTIONS',
  UPDATE_CLINIC_PROMOTIONS: 'UPDATE_CLINIC_PROMOTIONS',
  UPDATE_SPONSORED_PRODUCTS: 'UPDATE_SPONSORED_PRODUCTS',
};

// Reducer
const homePageReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_HOME_PAGE_DATA:
      return {
        ...state,
        ...action.payload,
        lastFetched: new Date(),
      };
    case actionTypes.UPDATE_PT_PROMOTIONS:
      return { ...state, ptPromotions: action.payload };
    case actionTypes.UPDATE_CLINIC_PROMOTIONS:
      return { ...state, clinicPromotions: action.payload };
    case actionTypes.UPDATE_SPONSORED_PRODUCTS:
      return { ...state, sponsoredProducts: action.payload };
    default:
      return state;
  }
};

// Context
const HomePageContext = createContext();

// Provider component
export const HomePageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(homePageReducer, initialState);

  // Fetch all home page data at once
  const fetchHomePageData = useCallback(async (forceRefresh = false) => {
    try {
      const response = await API.get(`${API_URL}/home-page/data`);
      
      dispatch({
        type: actionTypes.SET_HOME_PAGE_DATA,
        payload: response.data,
      });

      return response.data;
    } catch (error) {
      console.error('Home Page data fetch error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load home page data';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Manual refresh function
  const refreshHomePage = useCallback(async () => {
    return await fetchHomePageData(true);
  }, [fetchHomePageData]);

  // Force clear backend cache and refresh
  const forceRefreshHomePage = useCallback(async () => {
    try {
      // Clear backend cache
      await API.delete(`${API_URL}/home-page/cache`);
      console.log('🗑️ Backend cache cleared');
      
      // Force refresh frontend data
      return await refreshHomePage();
    } catch (error) {
      console.error('Error clearing backend cache:', error);
      // Still try to refresh frontend data
      return await refreshHomePage();
    }
  }, [refreshHomePage]);

  // Context value
  const value = {
    ...state,
    fetchHomePageData,
    refreshHomePage,
    forceRefreshHomePage,
  };

  return (
    <HomePageContext.Provider value={value}>
      {children}
    </HomePageContext.Provider>
  );
};

// Hook to use the context
export const useHomePage = () => {
  const context = useContext(HomePageContext);
  if (!context) {
    throw new Error('useHomePage must be used within a HomePageProvider');
  }
  return context;
};

export default HomePageContext;
