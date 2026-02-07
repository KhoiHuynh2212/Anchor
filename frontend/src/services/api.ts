import axios from "axios";
import Constants from "expo-constants";
import { supabase } from "./supabase";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
