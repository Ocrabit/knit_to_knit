// src/services/auth.service.ts

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://knittoknit.com/api/";  // we're reading this value from .env file
console.log(import.meta.env.VITE_API_URL);

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403 && error.response?.data?.error?.toLowerCase().includes('session')) {
      console.error("Session expired. Redirecting to login...");
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Function to retrieve CSRF token from cookies
export const getCsrfToken = (): string => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return csrfToken || '';
};

const checkSession = async () => {
  try {
    // Fetch the current user to check if the session is still valid
    const response = await axiosInstance.get(`/user/me/`);
    const user = response.data;
    if (user) {
      return user; // return user if successfully there
    }
    return null // If user is empty return null
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 403) {
        console.log('Session has expired or is invalid');
        return null; // No valid session
      }
    }
    console.error('Error while checking session:', error);
    throw error; // Throw other errors
  }
};

const login = async (username: string, password: string) => {
  try {
    //Fetch CSRF token
    const csrfToken = getCsrfToken();

    const response = await axiosInstance.post(`/login/`, {
      username: username,
      password: password,
    },{
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    console.log('Login successful:', response.data)

    //Fetch User Profile After Login
    const userResponse = await axiosInstance.get('/user/me/')
    const user = userResponse.data;

    return {user};
  } catch (error) {
    console.error('Login or user grab error:', error);
    throw error;
  }
};

// Logout Method
const logout = async () => {
  try {
    //Fetch CSRF token
    const csrfToken = getCsrfToken();

    console.log('Logout request headers:', {
      csrfToken: getCsrfToken(),
      cookies: document.cookie,
    });

    const response = await axiosInstance.post(`/logout/`,{},
        {
          headers: {
            'X-CSRFToken': csrfToken,
          },
        });
    console.log("Logout successful:", response.data);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

const authService = { login, logout, checkSession};

export default authService;