import axios from "axios";
import Constants from "expo-constants";
import { supabase } from "./supabase";

const extra =
  Constants.expoConfig?.extra ??
  Constants.manifest2?.extra ??
  (Constants.manifest as { extra?: Record<string, string> } | null)?.extra;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof extra?.apiUrl === "string" ? extra.apiUrl : undefined) ||
  "http://localhost:8000";

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
