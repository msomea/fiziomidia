import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchCurrentUser, loginUser, logoutUser } from "../api/auth";
import { toast } from "react-hot-toast";

export const AuthContext = createContext(null);

//  Default guest user
export const DEFAULT_USER = {
  _id: null,
  fullName: "Guest",
  profileImageUrl: "/assets/avatar.jpg", // fallback avatar
  role: "guest",
  createdAt: null,
  email: null,
};

export const AuthProvider = ({ children }) => {
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
            const data = await fetchCurrentUser();
            const updatedUser = { ...parsed, ...data };
            if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // expired or invalid token
          setUser(DEFAULT_USER);
          localStorage.clear();
        }
        console.warn("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      return data.user;
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
      throw err;
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
      if (navigate) navigate("/");
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
