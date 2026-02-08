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

// If backend says token is invalid, refresh once and retry.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (status === 401 && original && !original.__retried) {
      original.__retried = true;
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && data.session?.access_token) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
