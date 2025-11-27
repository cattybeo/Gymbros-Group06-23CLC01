import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

// Tạo một Storage Adapter để tránh lỗi trên Server (Node.js)
const ExpoStorage = {
  getItem: (key: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return Promise.resolve(null); // Đang chạy trên Server -> Trả về null
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return Promise.resolve(); // Đang chạy trên Server -> Không làm gì cả
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return Promise.resolve(); // Đang chạy trên Server -> Không làm gì cả
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: ExpoStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);
