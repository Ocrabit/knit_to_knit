// src/services/auth.service.ts

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;  // we're reading this value from .env file

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // this is a must - read about it below
  headers: {
    "Content-Type": "application/json",
  },
});

const login = async (username: string, password: string) => {
  const response = await axiosInstance.post(`/api/login/`, {
    username: username,
    password: password,
  });

  return response;
};

const authService = { login };

export default authService;