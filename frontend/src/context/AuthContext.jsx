import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchCurrentUser, loginUser, logoutUser } from "../api/auth";
import { useTranslation } from "react-i18next";
import { getSocket } from "../socket";
import toast from "react-hot-toast";

export const AuthContext = createContext(null);

//  Default guest user
export const DEFAULT_USER = {
  _id: null,
  fullName: "Guest",
  profileImageUrl: "/assets/avatar.jpg", // fallback avatar
  role: "guest",
  createdAt: null,
  email: null,
  language: "sw",
};

// Clear user cache utility
export const clearUserCache = () => {
  const cachedUserElement = document.getElementById('cached-member-user');
  if (cachedUserElement) {
    cachedUserElement.textContent = '';
    cachedUserElement.removeAttribute('data-user-id');
  }
};

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : DEFAULT_USER;
  });

  const [loading, setLoading] = useState(true);

  // Load current user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.accessToken) {
            // Check if we're on member dashboard page and have cached data
            const isMemberDashboard = window.location.pathname.includes('/member/dashboard');
            const cachedUserElement = document.getElementById('cached-member-user');
            const cachedUserData = cachedUserElement ? JSON.parse(cachedUserElement.textContent) : null;
            
            let data;
            if (isMemberDashboard && cachedUserData && cachedUserData._id === parsed._id) {
              // Validate session: ensure cached user matches current stored user
              const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
              if (storedUser._id === cachedUserData._id && storedUser.accessToken === cachedUserData.accessToken) {
                // Use cached data from dashboard context instead of making API call
                data = cachedUserData;
                console.log('Using cached user data from member dashboard');
              } else {
                // Session mismatch - clear cache and fetch fresh data
                console.log('Session mismatch, clearing cache and fetching fresh data');
                clearUserCache();
                data = await fetchCurrentUser();
              }
            } else {
              // Make API call for other pages or if no cached data
              data = await fetchCurrentUser();
              console.log('Fetching fresh user data');
            }
            
            const updatedUser = { ...parsed, ...data };
            if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              // 🔥 Update language based on user preference
              i18n.changeLanguage(updatedUser.language || "sw");
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // expired or invalid token
          try {
            await logoutUser();
          } catch (logoutErr) {
            console.error("Backend auto-logout failed:", logoutErr);
          }
          setUser(DEFAULT_USER);
          localStorage.clear();
          // Clear DOM cache for security
          const cachedUserElement = document.getElementById('cached-member-user');
          if (cachedUserElement) {
            cachedUserElement.textContent = '';
            cachedUserElement.removeAttribute('data-user-id');
          }
        }
        console.warn("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure the socket joins the user's personal room whenever we have a logged in user
  useEffect(() => {
    if (!user?._id) return;
    try {
      const socket = getSocket();
      socket.emit("joinRoom", user._id);
    } catch (err) {
      console.warn("Failed to emit joinRoom:", err);
    }
  }, [user?._id]);

  // Login function
  const login = async ({ email, password }) => {
    try {
      if (!email || !password) throw new Error("Email and password required");

      const data = await loginUser({ email, password });
      const newUser = { ...data.user, accessToken: data.accessToken };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Optional: reconnect socket with token
      const socket = getSocket();
      if (socket.connected) socket.disconnect(); // disconnect old socket
      socket.connect(); // reconnect with new token
      
      // 🔥 Change language based on user preference
      i18n.changeLanguage(data.user.language || "sw");
  
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async (navigate) => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(DEFAULT_USER); // reset to guest
      localStorage.clear();
      clearUserCache(); // Clear DOM cache for security
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
