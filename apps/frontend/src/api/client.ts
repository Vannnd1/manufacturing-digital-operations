import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  timeout: 15000, // 15-second bounded client timeout to prevent indefinite hangs
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/seed-demo-users");

    // Extract request correlation ID from backend response headers if present
    const requestId = error.response?.headers?.["x-request-id"];
    if (requestId) {
      error.requestId = requestId;
    }

    // Distinguish network unavailability from HTTP application error responses
    if (!error.response) {
      error.isNetworkError = true;
      error.userMessage = "Backend server unreachable. Please verify your network connection or server status.";
    } else if (error.response.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } else if (error.response.status === 503) {
      error.userMessage = error.response.data?.error || "Service temporarily unavailable. Please retry shortly.";
    } else if (error.response.status >= 500) {
      error.userMessage = error.response.data?.error || "Internal server error occurred.";
    }

    return Promise.reject(error);
  }
);
