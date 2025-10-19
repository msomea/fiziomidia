import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchCurrentUser, loginUser, logoutUser } from "../api/auth";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
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
            setUser({ ...parsed, ...data });
            localStorage.setItem("user", JSON.stringify({ ...parsed, ...data }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user:", err);
        setUser(null);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

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

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
