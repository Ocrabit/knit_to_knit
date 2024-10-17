// src/services/auth.service.ts

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;  // we're reading this value from .env file

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response, // If the response is successful, just return it
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`/api/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);

          // Update the Authorization header for the new access token
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;

          // Retry the original request with the new access token
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token expired or invalid. Logging out.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);


const login = async (username: string, password: string) => {
  const response = await axiosInstance.post(`/api/login/`, {
    username: username,
    password: password,
  });

  // Save the tokens to local storage
  const { access, refresh } = response.data;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  return response;
};

// Logout Method
const logout = async () => {
  try {
    // Immediately clear tokens before making the request
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Make a logout request to the server
    const response = await axiosInstance.post(`/api/logout/`);

    if (response.status === 204) {
      console.log("Logout successful");
    }

    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

const authService = { login, logout};

export default authService;