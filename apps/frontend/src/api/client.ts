import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { handleMockRequest } from "./mockHandler";

// Check if running on Vercel / remote host without a designated remote backend
const isRemoteWithoutBackend =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1" &&
  !import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  timeout: isRemoteWithoutBackend ? 2000 : 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When deployed on Vercel or cloud preview without a live remote backend API,
  // route instantly to the local Panasonic mock simulation engine for 0ms lag
  if (isRemoteWithoutBackend || import.meta.env.VITE_USE_MOCK === "true") {
    config.adapter = async () => {
      const data = handleMockRequest(config.url || "", config.method || "get", config.data);
      const res: AxiosResponse = {
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
      return res;
    };
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend network is unreachable on localhost (e.g. backend stopped),
    // gracefully fall back to the built-in Panasonic mock engine so UI never breaks
    if (!error.response && error.config) {
      try {
        const fallbackData = handleMockRequest(
          error.config.url || "",
          error.config.method || "get",
          error.config.data
        );
        return {
          data: fallbackData,
          status: 200,
          statusText: "OK",
          headers: {},
          config: error.config,
        };
      } catch {
        // Fall through to standard error handling
      }
    }

    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/seed-demo-users");

    const requestId = error.response?.headers?.["x-request-id"];
    if (requestId) {
      error.requestId = requestId;
    }

    if (!error.response) {
      error.isNetworkError = true;
      error.userMessage = "Backend server unreachable. Falling back to local offline mode.";
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
