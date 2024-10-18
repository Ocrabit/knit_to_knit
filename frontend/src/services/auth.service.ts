// src/services/auth.service.ts

import axios from "axios";
import { jwtDecode }  from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL;  // we're reading this value from .env file

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to check if the token is about to expire
const isTokenExpiring = (token: string): boolean => {
  const decoded = jwtDecode<{ exp: number }>(token);  // Decodes the JWT token
  const currentTime = Date.now() / 1000;  // Current time in seconds
  return decoded.exp < currentTime + 60;  // Checks if token expires in the next 60 seconds
};

// Request interceptor to add Authorization header and proactively refresh token if needed
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // If the access token is about to expire, refresh it before sending the request
    if (accessToken && isTokenExpiring(accessToken) && refreshToken) {
      try {
        // Refresh the access token
        const response = await axiosInstance.post(`/login/refresh/`, { refresh: refreshToken });
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Add the new access token to the request headers
        config.headers['Authorization'] = `Bearer ${newAccessToken}`;
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // Handle refresh failure (e.g., log the user out)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } else if (accessToken) {
      // If the token is valid, just add it to the request headers
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh when receiving a 401 error
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we receive a 401 and it's not a retry, attempt to refresh the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;  // Mark the request as a retry

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Request a new access token using the refresh token
          const response = await axiosInstance.post(`/login/refresh/`, { refresh: refreshToken });
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Retry the original request with the new access token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token expired or invalid. Logging out.");
          // Log the user out if the refresh token is invalid or expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);


const login = async (username: string, password: string) => {
  try {
    const response = await axiosInstance.post(`/api/login/`, {
      username: username,
      password: password,
    });

    // Save the tokens to local storage
    const {access, refresh} = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    const userResponse = await axiosInstance.get('/api/user/me/')

    const user = userResponse.data;

    return {access, refresh, user};
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout Method
const logout = async () => {
  try {
    const response = await axiosInstance.post(`/api/logout/`, {
      refresh: localStorage.getItem("refresh_token"),
    });

    // Make a logout request to the server
    if (response.status === 204) {
      console.log("Logout successful");
    }

    // Immediately clear tokens before making the request
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

const authService = { login, logout};

export default authService;