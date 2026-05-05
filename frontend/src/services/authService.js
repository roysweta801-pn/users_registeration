import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  // Token management
  getTokens() {
    return {
      access: localStorage.getItem("access_token"),
      refresh: localStorage.getItem("refresh_token"),
    };
  }

  setTokens(access, refresh) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  // Authentication
  async register(userData) {
    const response = await api.post("/auth/register/", userData);
    const { tokens } = response.data;
    this.setTokens(tokens.access, tokens.refresh);
    return response.data;
  }

  async login(email, password) {
    const response = await api.post("/auth/login/", { email, password });
    const { tokens } = response.data;
    this.setTokens(tokens.access, tokens.refresh);
    return response.data;
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout/", { refresh_token: refreshToken });
      }
    } finally {
      this.clearTokens();
    }
  }

  async getProfile() {
    const response = await api.get("/auth/profile/");
    return response.data;
  }

  async updateProfile(userData) {
    const response = await api.patch("/auth/profile/", userData);
    return response.data;
  }

  // 2FA
  async setup2FA() {
    const response = await api.get("/auth/2fa/setup/");
    return response.data;
  }

  async verify2FASetup(token) {
    const response = await api.post("/auth/2fa/verify/", { token });
    return response.data;
  }

  async disable2FA(password) {
    const response = await api.post("/auth/2fa/disable/", { password });
    return response.data;
  }

  async verify2FALogin(email, token, isBackupCode = false) {
    const response = await api.post("/auth/2fa/verify-login/", {
      email,
      token,
      is_backup_code: isBackupCode,
    });
    const { tokens } = response.data;
    this.setTokens(tokens.access, tokens.refresh);
    return response.data;
  }

  // Password management
  async requestPasswordReset(email) {
    const response = await api.post("/auth/password-reset/", { email });
    return response.data;
  }

  async confirmPasswordReset(token, newPassword, newPasswordConfirm) {
    const response = await api.post("/auth/password-reset/confirm/", {
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  }
}

export const authService = new AuthService();
