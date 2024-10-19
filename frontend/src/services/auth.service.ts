// src/services/auth.service.ts

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;  // we're reading this value from .env file

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  }, // ask about this
});

// Function to retrieve CSRF token from cookies
const getCsrfToken = (): string => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return csrfToken || '';
};

const checkSession = async () => {
  try {
    // Fetch the current user to check if the session is still valid
    const response = await axiosInstance.get(`/api/user/me/`);
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

    const response = await axiosInstance.post(`/api/login/`, {
      username: username,
      password: password,
    },{
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    console.log('Login successful:', response.data)

    //Fetch User Profile After Login
    const userResponse = await axiosInstance.get('/api/user/me/')
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

    const response = await axiosInstance.post(`/api/logout/`,{},
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