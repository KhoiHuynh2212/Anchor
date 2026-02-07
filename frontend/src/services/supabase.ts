import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  "https://pjpsjbywokiapiajdinv.supabase.co";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcHNqYnl3b2tpYXBpYWpkaW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTAyNjAsImV4cCI6MjA4NjA2NjI2MH0.h-Mqo7Ikf0s3P375Uhw355ctR6EiJ2C_FU6dMsuj2Yk";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== "web" ? ExpoSecureStoreAdapter : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
