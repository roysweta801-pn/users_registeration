import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(false);
  const [pending2FAEmail, setPending2FAEmail] = useState("");

  useEffect(() => {
    // Check for stored tokens on app load
    const tokens = authService.getTokens();
    if (tokens.access) {
      authService
        .getProfile()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          authService.logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.requires_2fa) {
        setPending2FA(true);
        setPending2FAEmail(email);
        return { requires2FA: true };
      }

      setUser(response.user);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
      throw error;
    }
  };

  const verify2FA = async (token, isBackupCode = false) => {
    try {
      const response = await authService.verify2FALogin(
        pending2FAEmail,
        token,
        isBackupCode
      );
      setUser(response.user);
      setPending2FA(false);
      setPending2FAEmail("");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "2FA verification failed");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setPending2FA(false);
      setPending2FAEmail("");
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Profile update failed");
      throw error;
    }
  };

  const setup2FA = async () => {
    try {
      const response = await authService.setup2FA();
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || "2FA setup failed");
      throw error;
    }
  };

  const verify2FASetup = async (token) => {
    try {
      const response = await authService.verify2FASetup(token);
      setUser(response.user);
      toast.success("2FA enabled successfully");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "2FA verification failed");
      throw error;
    }
  };

  const disable2FA = async (password) => {
    try {
      const response = await authService.disable2FA(password);
      setUser(response.user);
      toast.success("2FA disabled successfully");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to disable 2FA");
      throw error;
    }
  };


  const value = {
    user,
    loading,
    pending2FA,
    pending2FAEmail,
    login,
    verify2FA,
    register,
    logout,
    updateProfile,
    setup2FA,
    verify2FASetup,
    disable2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
